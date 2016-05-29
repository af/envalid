const EnvError = exports.EnvError = function EnvError() {}

exports.lockEnv = function lockEnv(env, specs = {}, options = {}) {
    const output = {}
    const varKeys = Object.keys(specs)

    for (const k of varKeys) {
        const value = env[k] || specs[k].default
        if (value == null) throw new EnvError(`Missing env var "${k}"`)
        output[k] = value
    }

    return options.strict
        ? output
        : Object.assign({}, env, output)
}
