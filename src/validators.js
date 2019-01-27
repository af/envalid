const isFQDN = require('validator/lib/isFQDN')
const isIP = require('validator/lib/isIP')
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/ // intentionally non-exhaustive

class EnvError extends TypeError {
    constructor(...args) {
        super(...args)
        Error.captureStackTrace(this, EnvError)
        this.name = 'EnvError'
    }
}
exports.EnvError = EnvError

class EnvMissingError extends ReferenceError {
    constructor(...args) {
        super(...args)
        Error.captureStackTrace(this, EnvMissingError)
        this.name = 'EnvMissingError'
    }
}
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

exports.str = makeValidator(input => {
    if (typeof input === 'string') return input
    throw new EnvError(`Not a string: "${input}"`)
}, 'str')

exports.email = makeValidator(x => {
    if (EMAIL_REGEX.test(x)) return x
    throw new EnvError(`Invalid email address: "${x}"`)
}, 'email')

exports.host = makeValidator(input => {
    if (!isFQDN(input, { require_tld: false }) && !isIP(input)) {
        throw new EnvError(`Invalid host (domain or ip): "${input}"`)
    }
    return input
}, 'host')

exports.port = makeValidator(input => {
    const coerced = +input
    if (
        Number.isNaN(coerced) ||
        `${coerced}` !== `${input}` ||
        coerced % 1 !== 0 ||
        coerced < 1 ||
        coerced > 65535
    ) {
        throw new EnvError(`Invalid port input: "${input}"`)
    }
    return coerced
}, 'port')

exports.url = makeValidator(x => {
    const url = require('url')
    let isValid = false

    if (url.URL) {
        try {
            new url.URL(x)
            isValid = true
        } catch (e) {
            isValid = false
        }
    } else {
        const parsed = url.parse(x)
        isValid = !!(parsed.protocol && parsed.host && parsed.slashes)
    }

    if (isValid) return x
    throw new EnvError(`Invalid url: "${x}"`)
}, 'url')

exports.json = makeValidator(x => {
    try {
        return JSON.parse(x)
    } catch (e) {
        throw new EnvError(`Invalid json: "${x}"`)
    }
}, 'json')
