import { Spec, ValidatorSpec } from './types'

// import isFQDN from 'validator/lib/isFQDN'
// import isIP from 'validator/lib/isIP'
// FIXME proper implementation
const isFQDN = (x: any, y: any) => false
const isIP = (x: any) => false

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/ // intentionally non-exhaustive

export class EnvError extends TypeError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, EnvError)
    this.name = 'EnvError'
  }
}

export class EnvMissingError extends ReferenceError {
  constructor(...args: any[]) {
    super(...args)
    Error.captureStackTrace(this, EnvMissingError)
    this.name = 'EnvMissingError'
  }
}

export const makeValidator = <T>(parseFn: (input: string) => T, type: string = 'unknown') => {
  return function(spec: Spec<T>): ValidatorSpec<T> {
    return { ...spec, type, _parse: parseFn }
  }
}

// FIXME: look into type parameter stuff from old libdefs
export const bool = makeValidator((input: string | boolean) => {
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

export const num = makeValidator((input: string) => {
  const coerced = +input
  if (Number.isNaN(coerced)) throw new EnvError(`Invalid number input: "${input}"`)
  return coerced
}, 'num')

export const str = makeValidator((input: string) => {
  if (typeof input === 'string') return input
  throw new EnvError(`Not a string: "${input}"`)
}, 'str')

export const email = makeValidator((x: string) => {
  if (EMAIL_REGEX.test(x)) return x
  throw new EnvError(`Invalid email address: "${x}"`)
}, 'email')

export const host = makeValidator((input: string) => {
  if (!isFQDN(input, { require_tld: false }) && !isIP(input)) {
    throw new EnvError(`Invalid host (domain or ip): "${input}"`)
  }
  return input
}, 'host')

export const port = makeValidator((input: string) => {
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

export const url = makeValidator((x: string) => {
  try {
    new URL(x)
    return x
  } catch (e) {
    throw new EnvError(`Invalid url: "${x}"`)
  }
}, 'url')

export const json = makeValidator((x: string) => {
  try {
    return JSON.parse(x)
  } catch (e) {
    throw new EnvError(`Invalid json: "${x}"`)
  }
}, 'json')
