import { EnvError } from './errors'
import { makeExactValidator, makeStructuredValidator, makeValidator } from './makers'

// Simplified adaptation of https://github.com/validatorjs/validator.js/blob/master/src/lib/isFQDN.js
const isFQDN = (input: string) => {
  if (!input.length) return false
  const parts = input.split('.')
  for (let part, i = 0; i < parts.length; i++) {
    part = parts[i]
    if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) return false
    if (/[\uff01-\uff5e]/.test(part)) return false // disallow full-width chars
    if (part[0] === '-' || part[part.length - 1] === '-') return false
  }
  return true
}

// "best effort" regex-based IP address check
// If you want a more exhaustive check, create your own custom validator, perhaps wrapping this
// implementation (the source of the ipv4 regex below): https://github.com/validatorjs/validator.js/blob/master/src/lib/isIP.js
const ipv4Regex =
  /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
const ipv6Regex = /([a-f0-9]+:+)+[a-f0-9]+/
const isIP = (input: string) => {
  if (!input.length) return false
  return ipv4Regex.test(input) || ipv6Regex.test(input)
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/ // intentionally non-exhaustive

// We use exact validator here because narrowing down to either 'true' or 'false'
// makes no sense.
export const bool = makeExactValidator<boolean>((input: string | boolean) => {
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
      throw new EnvError(`Invalid bool input: "${input}"`)
  }
})

export const num = makeValidator<number>((input: string) => {
  const coerced = parseFloat(input)
  if (Number.isNaN(coerced)) throw new EnvError(`Invalid number input: "${input}"`)
  return coerced
})

export const str = makeValidator<string>((input: string) => {
  if (typeof input === 'string') return input
  throw new EnvError(`Not a string: "${input}"`)
})

export const email = makeValidator<string>((x: string) => {
  if (EMAIL_REGEX.test(x)) return x
  throw new EnvError(`Invalid email address: "${x}"`)
})

export const host = makeValidator<string>((input: string) => {
  if (!isFQDN(input) && !isIP(input)) {
    throw new EnvError(`Invalid host (domain or ip): "${input}"`)
  }
  return input
})

export const port = makeValidator<number>((input: string) => {
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
})

export const url = makeValidator<string>((x: string) => {
  try {
    new URL(x)
    return x
  } catch (e) {
    throw new EnvError(`Invalid url: "${x}"`)
  }
})

/**
 * Unless passing a default property, it's recommended that you provide an explicit type parameter
 * for json validation if you're using TypeScript. Otherwise the output will be typed as `any`.
 * For example:
 *
 * ```ts
 * cleanEnv({
 *   MY_VAR: json<{ foo: number }>(),
 * })
 * ```
 */
export const json = makeStructuredValidator((x: string) => {
  try {
    return JSON.parse(x)
  } catch (e) {
    throw new EnvError(`Invalid json: "${x}"`)
  }
})
