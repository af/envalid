exports.lockEnv = function lockEnv(env, specs = {}, options = {}) {
    const output = {}
    const varKeys = Object.keys(specs)
    for (const k of varKeys) {
        output[k] = env[k]
    }
    return options.strict
        ? output
        : Object.assign({}, env, output)
}
