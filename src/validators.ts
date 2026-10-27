import { EnvError } from './errors.ts'
import { displayMasked, displayValue } from './mask.ts'
import { makeExactValidator, makeStructuredValidator, makeValidator } from './makers.ts'
import type { Mask } from './types.ts'

// Simplified adaptation of https://github.com/validatorjs/validator.js/blob/master/src/lib/isFQDN.js
const isFQDN = (input: string) => {
  if (!input.length) return false
  const parts = input.split('.')
  for (let part: string, i = 0; i < parts.length; i++) {
    part = parts[i]
    if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) return false
    if (/[\uff01-\uff5e]/.test(part)) return false // disallow full-width chars
    if (part[0] === '-' || part[part.length - 1] === '-') return false
  }
  return true
}

// "best effort" regex-based IP address check
// If you want a more exhaustive check, create your own custom validator
const ipv4Regex =
  /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}$/
const ipv6Regex =
  /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:)+:([0-9a-f]{1,4}:)*[0-9a-f]{1,4}|([0-9a-f]{1,4}:)*::([0-9a-f]{1,4}:)*[0-9a-f]{0,4}|::|(([0-9a-f]{1,4}:){1,6}|:):((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]))(%[0-9a-z.\-:]+)?$/i

const isIP = (input: string) => {
  if (!input.length) return false
  return ipv4Regex.test(input) || ipv6Regex.test(input)
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/ // intentionally non-exhaustive

// We use exact validator here because narrowing down to either 'true' or 'false'
// makes no sense.
export const bool = makeExactValidator<boolean>((input: string | boolean, mask?: Mask) => {
  switch (input) {
    case true:
    case 'true':
    case 't':
    case 'yes':
    case 'on':
    case '1':
      return true
    case false:
    case 'false':
    case 'f':
    case 'no':
    case 'off':
    case '0':
      return false
    default:
      throw new EnvError(`Invalid bool input${displayValue(input, mask)}`)
  }
})

export const num = makeValidator<number>((input: string, mask?: Mask) => {
  const coerced = parseFloat(input)
  if (Number.isNaN(coerced)) throw new EnvError(`Invalid number input${displayValue(input, mask)}`)
  return coerced
})

export const str = makeValidator<string>((input: string, mask?: Mask) => {
  if (typeof input === 'string') return input
  throw new EnvError(`Not a string${displayValue(input, mask)}`)
})

export const email = makeValidator<string>((x: string, mask?: Mask) => {
  if (EMAIL_REGEX.test(x)) return x
  throw new EnvError(`Invalid email address${displayValue(x, mask)}`)
})

export const host = makeValidator<string>((input: string, mask?: Mask) => {
  if (!isFQDN(input) && !isIP(input)) {
    throw new EnvError(`Invalid host (domain or ip)${displayValue(input, mask)}`)
  }
  return input
})

export const port = makeValidator<number>((input: string, mask?: Mask) => {
  const coerced = +input
  if (
    Number.isNaN(coerced) ||
    `${coerced}` !== `${input}` ||
    coerced % 1 !== 0 ||
    coerced < 1 ||
    coerced > 65535
  ) {
    throw new EnvError(`Invalid port input${displayValue(input, mask)}`)
  }
  return coerced
})

export const url = makeValidator<string>((x: string, mask?: Mask) => {
  try {
    new URL(x)
    return x
  } catch {
    // Not logging the url value unless a mask was provided
    throw new EnvError(`Invalid url${displayMasked(x, mask)}`)
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
export const json = makeStructuredValidator((x: string, mask?: Mask) => {
  try {
    return JSON.parse(x)
  } catch {
    // Not logging the json value unless a mask was provided
    throw new EnvError(`Invalid json${displayMasked(x, mask)}`)
  }
})
