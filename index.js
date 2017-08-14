const { EnvError, EnvMissingError, makeValidator,
        bool, num, str, json, url, email } = require('./lib/validators')

const extend = (x = {}, y = {}) => Object.assign({}, x, y)

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


// Format a string error message for when a required env var is missing
function formatSpecDescription(spec) {
    const egText = spec.example ? ` (eg. "${spec.example}")` : ''
    const docsText = spec.docs ? `. See ${spec.docs}` : ''
    return `${spec.desc}${egText}${docsText}` || ''
}

// Extend an env var object with the values parsed from a ".env"
// file, whose path is given by the second argument.
function extendWithDotEnv(inputEnv, dotEnvPath = '.env') {
    // fs and dotenv cannot be required inside react-native.
    // The react-native packager detects the require calls even if they
    // are not on the top level, so we need to obfuscate them
    const _require = require
    const fs = _require('fs')
    const dotenv = _require('dotenv')

    let dotEnvBuffer = null
    try {
        dotEnvBuffer = fs.readFileSync(dotEnvPath)
    } catch (err) {
        if (err.code === 'ENOENT') return inputEnv
        throw err
    }
    const parsed = dotenv.parse(dotEnvBuffer)
    return extend(parsed, inputEnv)
}

function cleanEnv(inputEnv, specs = {}, options = {}) {
    let output = {}
    let defaultNodeEnv = ''
    const errors = {}
    const env = (options.dotEnvPath !== null)
        ? extendWithDotEnv(inputEnv, options.dotEnvPath)
        : inputEnv
    const varKeys = Object.keys(specs)

    // If validation for NODE_ENV isn't specified, use the default validation:
    if (!varKeys.includes('NODE_ENV')) {
        defaultNodeEnv = validateVar({
            name: 'NODE_ENV',
            spec: str({ choices: ['development', 'test', 'production'] }),
            rawValue: env.NODE_ENV || 'production'
        })
    }

    for (const k of varKeys) {
        const spec = specs[k]
        const devDefault = (env.NODE_ENV === 'production' ? undefined : spec.devDefault)
        let rawValue = env[k]

        if (rawValue === undefined) {
            rawValue = (devDefault === undefined ? spec.default : devDefault)
        }

        // Default values can be anything falsy (besides undefined), without
        // triggering validation errors:
        const usingFalsyDefault = ((spec.default !== undefined) && (spec.default === rawValue)) ||
                                  ((devDefault !== undefined) && (devDefault === rawValue))

        try {
            if (rawValue === undefined && !usingFalsyDefault) {
                throw new EnvMissingError(formatSpecDescription(spec))
            }
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

    if (options.transformer) {
        output = options.transformer(output)
    }

    const reporter = options.reporter || require('./lib/reporter')
    reporter({ errors, env: output })

    if (options.strict) output = require('./lib/strictProxy')(output)

    return Object.freeze(output)
}


/**
* Utility function for providing default values only when NODE_ENV=test
*
* For more context, see https://github.com/af/envalid/issues/32
*/
const testOnly = defaultValueForTests => {
    return process.env.NODE_ENV === 'test'
        ? defaultValueForTests
        : undefined
}


module.exports = {
    cleanEnv, makeValidator,                // core API
    bool, num, str, json, url, email,       // built-in validators
    EnvError, EnvMissingError,              // error subclasses
    testOnly                                // utility function(s)
}
