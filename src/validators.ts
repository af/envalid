import { Spec, ValidatorSpec, BaseValidator, MarkupValidator, ExactValidator } from './types'
import { EnvError } from './errors'

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

const internalMakeValidator = <T>(parseFn: (input: string) => T) => {
  return (spec?: Spec<unknown>) => ({ ...spec, _parse: parseFn } as ValidatorSpec<T>)
}

/**
 * Creates a validator which can output subtypes of `BaseT`. E.g.:
 *
 * ```ts
 * const int = makeValidator<number>((input: string) => {
 *   // Implementation details
 * })
 * const MAX_RETRIES = int({ choices: [1, 2, 3, 4] })
 * // Narrows down output type to 1 | 2 | 3 | 4
 * ```
 *
 * @param parseFn - A function to parse and validate input.
 * @returns A validator which output type is narrowed-down to a subtype of `BaseT`
 */
export const makeValidator = <BaseT>(
  parseFn: (input: string) => BaseT,
): BaseValidator<BaseT> => {
  return internalMakeValidator(parseFn) as BaseValidator<BaseT>
}

/**
 * Creates a validator which output type is exactly T:
 *
 * ```ts
 * const int = makeExactValidator<number>((input: string) => {
 *   // Implementation details
 * })
 * const MAX_RETRIES = int({ choices: [1, 2, 3, 4] })
 * // Output type 'number'
 * ```
 *
 * @param parseFn - A function to parse and validate input.
 * @returns A validator which output type is exactly `T`
 */
export const makeExactValidator = <T>(parseFn: (input: string) => T): ExactValidator<T> => {
  return internalMakeValidator(parseFn) as ExactValidator<T>
}

/**
 * Creates a validator which output type is entirely parametric.
 * It default the output type to any if no type inference can be made.
 *
 * ```ts
 * const queryParams = makeMarkupValidator((input: string) => {
 *   // Implementation details
 * })
 * const OPTIONS = queryParams({ default: { option1: true, option2: false } })
 * // Output type '{ option1: boolean, option2: boolean }'
 * ```
 *
 * @param parseFn - A function to parse and validate input.
 * @returns A validator which output type is exactly `T`
 */
export const makeMarkupValidator = (parseFn: (input: string) => unknown): MarkupValidator => {
  return internalMakeValidator(parseFn) as MarkupValidator
}

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
export const json = makeMarkupValidator((x: string) => {
  try {
    return JSON.parse(x)
  } catch (e) {
    throw new EnvError(`Invalid json: "${x}"`)
  }
})
