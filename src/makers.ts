import { Spec, BaseValidator, StructuredValidator, ExactValidator } from './types'

const internalMakeValidator = <T>(parseFn: (input: string) => T) => {
  return (spec?: Spec<unknown>) => ({ ...spec, _parse: parseFn })
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
export const makeValidator = <BaseT>(parseFn: (input: string) => BaseT): BaseValidator<BaseT> => {
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
 * This validator is meant for inputs which can produce arbitrary output types (e.g. json).
 * The typing logic behaves differently from other makers:
 *
 * - makeStructuredValidator has no type parameter.
 * - When no types can be inferred from context, output type defaults to any.
 * - Otherwise, infers type from `default` or `devDefault`.
 * - Also generated validators have an output type parameter.
 * - Finally, the generated validators disallow `choices` parameter.
 *
 * Below is an example of a validator for query parameters (e.g. `option1=foo&option2=bar`):
 *
 * ```ts
 * const queryParams = makeStructuredValidator((input: string) => {
 *   const params = new URLSearchParams(input)
 *   return Object.fromEntries(params.entries())
 * })
 * const OPTIONS1 = queryParams()
 * // Output type 'any'
 * const OPTIONS2 = queryParams({ default: { option1: 'foo', option2: 'bar' } })
 * // Output type '{ option1: string, option2: string }'
 * const OPTIONS3 = queryParams<{ option1?: string; option2?: string }>({
 *   default: { option1: 'foo', option2: 'bar' },
 * })
 * // Output type '{ option1?: string, option2?: string }'
 * ```
 *
 * @param parseFn - A function to parse and validate input.
 * @returns A validator which output type is exactly `T`
 */
export const makeStructuredValidator = (
  parseFn: (input: string) => unknown,
): StructuredValidator => {
  return internalMakeValidator(parseFn) as StructuredValidator
}
