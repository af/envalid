function EnvError(input) {
    this.message = input
    this.stack = new Error().stack
}
EnvError.prototype = Object.create(Error.prototype)
EnvError.prototype.name = 'EnvError'
exports.EnvError = EnvError


function validateVar({ spec, name, value }) {
    if (spec.choices) {
        if (!Array.isArray(spec.choices)) {
            throw new Error(`"choices" must be an array (in spec for "${name}")`)
        } else if (!spec.choices.includes(value)) {
            throw new EnvError(`Env var "${name}" not in choices [${spec.choices}]`)
        }
    }
    if (value == null) throw new EnvError(`Missing env var "${name}"`)
    return value
}


exports.lockEnv = function lockEnv(env, specs = {}, options = {}) {
    const output = {}
    const varKeys = Object.keys(specs)

    for (const k of varKeys) {
        const spec = specs[k]
        const value = env[k] || spec.default
        output[k] = validateVar({ name: k, spec, value })
    }

    return options.strict
        ? output
        : Object.assign({}, env, output)
}
