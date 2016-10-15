const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/    // intentionally non-exhaustive


function EnvError(input) {
    this.message = input
    this.stack = new Error().stack
}
EnvError.prototype = Object.create(Error.prototype)
EnvError.prototype.name = 'EnvError'
exports.EnvError = EnvError


function EnvMissingError(input) {
    this.message = input
    this.stack = new Error().stack
}
EnvMissingError.prototype = Object.create(Error.prototype)
EnvMissingError.prototype.name = 'EnvMissingError'
exports.EnvMissingError = EnvMissingError



function makeValidator(parseFn, type = 'unknown') {
    return function(spec = {}) {
        spec.type = type
        spec._parse = parseFn
        return spec
    }
}
exports.makeValidator = makeValidator


exports.bool = makeValidator(input => {
    switch (input) {
        case true:
        case 'true':
        case 't':
        case '1':
            return true
        case false:
        case 'false':
        case 'f':
        case '0':
            return false
        default:
            return null
    }
}, 'bool')

exports.num = makeValidator(input => {
    const coerced = +input
    if (Number.isNaN(coerced)) throw new EnvError(`Invalid number input: "${input}"`)
    return coerced
}, 'num')

exports.str = makeValidator(input => input, 'str')

exports.email = makeValidator(x => {
    if (EMAIL_REGEX.test(x)) return x
    throw new EnvError(`Invalid email address: "${x}"`)
}, 'email')

exports.url = makeValidator(x => {
    const parsed = require('url').parse(x)
    const isValid = !!(parsed.protocol && parsed.host && parsed.slashes)
    return isValid ? x : null
}, 'url')

exports.json = makeValidator(x => {
    try {
        return JSON.parse(x)
    } catch (e) {
        throw new EnvError(`Invalid json: "${x}"`)
    }
}, 'json')

