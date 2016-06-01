// Intentionally simple regex for testing emails
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function EnvError(input) {
    this.message = input
    this.stack = new Error().stack
}
EnvError.prototype = Object.create(Error.prototype)
EnvError.prototype.name = 'EnvError'
exports.EnvError = EnvError


function validateVar({ spec = {}, name, rawValue }) {
    if (typeof spec._parse !== 'function') {
        throw new EnvError(`Invalid spec for "${name}"`)
    }
    const value = spec._parse(rawValue)

    if (spec.choices) {
        if (!Array.isArray(spec.choices)) {
            throw new Error(`"choices" must be an array (in spec for "${name}")`)
        } else if (!spec.choices.includes(value)) {
            throw new EnvError(`Env var "${name}" not in choices [${spec.choices}]`)
        }
    }
    if (value == null) throw new EnvError(`Invalid value for env var "${name}"`)
    return value
}


exports.cleanEnv = function cleanEnv(env, specs = {}, options = {}) {
    const output = {}
    const varKeys = Object.keys(specs)

    for (const k of varKeys) {
        const spec = specs[k]
        const rawValue = env[k] || spec.default
        output[k] = validateVar({ name: k, spec, rawValue })
    }

    return options.strict
        ? output
        : Object.assign({}, env, output)
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

exports.num = makeValidator(input => +input)

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
