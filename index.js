function EnvError(input) {
    this.message = input
    this.stack = new Error().stack
}
EnvError.prototype = Object.create(Error.prototype)
EnvError.prototype.name = 'EnvError'
exports.EnvError = EnvError

exports.lockEnv = function lockEnv(env, specs = {}, options = {}) {
    const output = {}
    const varKeys = Object.keys(specs)

    for (const k of varKeys) {
        const spec = specs[k]
        const value = env[k] || spec.default

        if (spec.choices) {
            if (!Array.isArray(spec.choices)) {
                throw new Error(`"choices" must be an array (in spec for "${k}")`)
            } else if (!spec.choices.includes(value)) {
                throw new EnvError(`Env var "${k}" not in choices [${spec.choices}]`)
            }
        }
        if (value == null) throw new EnvError(`Missing env var "${k}"`)
        output[k] = value
    }

    return options.strict
        ? output
        : Object.assign({}, env, output)
}
