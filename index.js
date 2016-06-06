const dotenv = require('dotenv')

const extend = (x = {}, y = {}) => Object.assign({}, x, y)
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/    // intentionally non-exhaustive

function EnvError(input) {
    this.message = input
    this.stack = new Error().stack
}
EnvError.prototype = Object.create(Error.prototype)
EnvError.prototype.name = 'EnvError'
exports.EnvError = EnvError


/**
* Validate a single env var, given a spec object
*
* @throws EnvError - If validation is unsuccessful
* @return - The cleaned value
*/
function validateVar({ spec = {}, name, rawValue }) {
    if (typeof spec._parse !== 'function') {
        throw new EnvError(`Invalid spec for "${name}"`)
    }
    const value = spec._parse(rawValue)

    if (spec.choices) {
        if (!Array.isArray(spec.choices)) {
            throw new Error(`"choices" must be an array (in spec for "${name}")`)
        } else if (!spec.choices.includes(value)) {
            throw new EnvError(`Value "${value}" not in choices [${spec.choices}]`)
        }
    }
    if (value == null) throw new EnvError(`Invalid value for env var "${name}"`)
    return value
}


function reportOnValidation({ errors = {}, env = {} }) {
    let errOutput = ''
    for (const k in errors) {
        errOutput += `    ${k}: ${errors[k].message}`
    }

    if (errOutput) {
        const makePlural = Object.keys(errors).length > 1
        const msg = `Invalid environment variable${makePlural ? 's' : ''}:
${errOutput}
Exiting with error code 1`
        console.log(msg)
        process.exit(1)
    }
}


exports.cleanEnv = function cleanEnv(inputEnv, specs = {}, options = {}) {
    let output = {}
    let defaultNodeEnv = ''
    const errors = {}
    const env = extend(dotenv.config({ silent: true }), inputEnv)
    const varKeys = Object.keys(specs)

    // If validation for NODE_ENV isn't specified, use the default validation:
    if (!varKeys.includes('NODE_ENV')) {
        defaultNodeEnv = validateVar({
            name: 'NODE_ENV',
            spec: exports.str({ choices: ['development', 'test', 'production'] }),
            rawValue: env.NODE_ENV || 'production'
        })
    }

    for (const k of varKeys) {
        const spec = specs[k]
        const rawValue = env[k] || spec.default
        try {
            output[k] = validateVar({ name: k, spec, rawValue })
        } catch (err) {
            if (options.reporter === null) throw err
            errors[k] = err
        }
    }

    // If we need to run Object.assign() on output, we must do it before the
    // defineProperties() call, otherwise the properties would be lost
    output = options.strict
        ? output
        : extend(env, output)

    Object.defineProperties(output, {
        isDev:        { value: (defaultNodeEnv || output.NODE_ENV) === 'development' },
        isProduction: { value: (defaultNodeEnv || output.NODE_ENV) === 'production' },
        isTest:       { value: (defaultNodeEnv || output.NODE_ENV) === 'test' }
    })

    const reporter = options.reporter || reportOnValidation
    reporter({ errors, env: output })

    return output
}


function makeValidator(parseFn) {
    return function(spec = {}) {
        spec._parse = parseFn
        return spec
    }
}

exports.bool = makeValidator(input => {
    switch (input) {
        case 'true':
        case 't':
        case '1':
            return true
        case 'false':
        case 'f':
        case '0':
            return false
        default:
            return null
    }
})

exports.num = makeValidator(input => {
    const coerced = +input
    if (Number.isNaN(coerced)) throw new EnvError(`Invalid number input: "${input}"`)
    return coerced
})

exports.str = makeValidator(input => input)

exports.email = makeValidator(x => {
    if (EMAIL_REGEX.test(x)) return x
    throw new EnvError(`Invalid email address: "${x}"`)
})

exports.url = makeValidator(x => {
    const parsed = require('url').parse(x)
    const isValid = !!(parsed.protocol && parsed.host && parsed.slashes)
    return isValid ? x : null
})

exports.json = makeValidator(x => {
    try {
        return JSON.parse(x)
    } catch (e) {
        throw new EnvError(`Invalid json: "${x}"`)
    }
})
