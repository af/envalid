import { CleanedEnv, CleanOptions } from './types'
import { getSanitizedEnv, testOnlySymbol } from './core'
import { applyDefaultMiddleware } from './middleware'

/**
 * Returns a sanitized, immutable environment object. _Only_ the env vars
 * specified in the `validators` parameter will be accessible on the returned
 * object.
 * @param environment An object containing your env vars (eg. process.env).
 * @param specs An object that specifies the format of required vars.
 * @param options An object that specifies options for cleanEnv.
 */
export function cleanEnv<S>(
  environment: unknown,
  specs: S,
  options: CleanOptions<S> = {},
): CleanedEnv<S> {
  const cleaned = getSanitizedEnv(environment, specs, options)
  return Object.freeze(applyDefaultMiddleware(cleaned, environment)) as CleanedEnv<S>
}

/**
 * Returns a sanitized, immutable environment object, and passes it through a custom
 * applyMiddleware function before being frozen. Most users won't need the flexibility of custom
 * middleware; prefer cleanEnv() unless you're sure you need it
 *
 * @param environment An object containing your env vars (eg. process.env).
 * @param specs An object that specifies the format of required vars.
 * @param applyMiddleware A function that applies transformations to the cleaned env object
 * @param options An object that specifies options for cleanEnv.
 */
export function customCleanEnv<S, MW>(
  environment: unknown,
  specs: S,
  applyMiddleware: (cleaned: CleanedEnv<S>, rawEnv: unknown) => MW,
  options: CleanOptions<S> = {},
): Readonly<MW> {
  const cleaned = getSanitizedEnv(environment, specs, options)
  return Object.freeze(applyMiddleware(cleaned as CleanedEnv<S>, environment))
}

/**
 * Utility function for providing default values only when NODE_ENV=test
 *
 * For more context, see https://github.com/af/envalid/issues/32
 */
export const testOnly = <T>(defaultValueForTests: T) => {
  return process.env.NODE_ENV === 'test' ? defaultValueForTests : (testOnlySymbol as unknown as T) // T is not strictly correct, but prevents type errors during usage
}
