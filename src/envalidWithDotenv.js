const envalid = require('./envalid')
const extend = require('./extend')

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

const originalCleanEnv = envalid.cleanEnv

envalid.cleanEnv = function cleanEnv(inputEnv, specs = {}, options = {}) {
    const env =
        options.dotEnvPath !== null ? extendWithDotEnv(inputEnv, options.dotEnvPath) : inputEnv
    return originalCleanEnv(env, specs, options)
}

module.exports = envalid
