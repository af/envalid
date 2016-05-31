function EnvError(input) {
    this.message = input
    this.stack = new Error().stack
}
EnvError.prototype = Object.create(Error.prototype)
EnvError.prototype.name = 'EnvError'
exports.EnvError = EnvError


exports.toBool = function toBool(input) {
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
}

exports.toNumber = function toNumber(input) {
    return +input
}

function validateVar({ spec, name, rawValue }) {
    const value = spec.parse ? spec.parse(rawValue) : rawValue

    if (spec.choices) {
        if (!Array.isArray(spec.choices)) {
            throw new Error(`"choices" must be an array (in spec for "${name}")`)
        } else if (!spec.choices.includes(value)) {
            throw new EnvError(`Env var "${name}" not in choices [${spec.choices}]`)
        }
    }
    if (value == null) {
        if (spec.parse) throw new EnvError(`Invalid value for env var "${name}"`)
        else throw new EnvError(`Missing env var "${name}"`)
    }
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
