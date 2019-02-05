const envalid = require('./envalidWithoutDotenv')
const { extend } = require('./utils')
const fs = require('fs')
const dotenv = require('dotenv')

// Extend an env var object with the values parsed from a ".env"
// file, whose path is given by the second argument.
function extendWithDotEnv(inputEnv, dotEnvPath = '.env') {
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
