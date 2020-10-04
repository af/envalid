import { EnvError, EnvMissingError, str } from './validators'
import { CleanEnv, CleanOptions, Spec, ValidatorSpec } from './types'
import defaultReporter from './reporter'

const testOnlySymbol = Symbol('envalid - test only')

/**
 * Validate a single env var, given a spec object
 *
 * @throws EnvError - If validation is unsuccessful
 * @return - The cleaned value
 */
function validateVar<T>({
  spec,
  name,
  rawValue,
}: {
  name: string
  rawValue: string
  spec: Spec<T> & { _parse: (input: string) => T }
}) {
  if (typeof spec._parse !== 'function') {
    throw new EnvError(`Invalid spec for "${name}"`)
  }
  const value = spec._parse(rawValue)

  if (spec.choices) {
    if (!Array.isArray(spec.choices)) {
      throw new TypeError(`"choices" must be an array (in spec for "${name}")`)
    } else if (!spec.choices.includes(value)) {
      throw new EnvError(`Value "${value}" not in choices [${spec.choices}]`)
    }
  }
  if (value == null) throw new EnvError(`Invalid value for env var "${name}"`)
  return value
}

// Format a string error message for when a required env var is missing
function formatSpecDescription<T>(spec: Spec<T>) {
  const egText = spec.example ? ` (eg. "${spec.example}")` : ''
  const docsText = spec.docs ? `. See ${spec.docs}` : ''
  return `${spec.desc}${egText}${docsText}` || ''
}

// FIXME: type this (strict and non-strict)

/**
 * Returns a sanitized, immutable environment object. _Only_ the env vars
 * specified in the `validators` parameter will be accessible on the returned
 * object.
 * @param environment An object containing your env vars (eg. process.env).
 * @param validators An object that specifies the format of required vars.
 * @param options An object that specifies options for cleanEnv.
 */
// export function cleanEnv<T>(
//   environment: unknown,
//   validators: { [K in keyof T]: ValidatorSpec<T[K]> },
//   options: StrictCleanOptions,
// ): Readonly<T> & CleanEnv
function cleanEnv<T>(
  env: unknown,
  specs: { [K in keyof T]: ValidatorSpec<T[K]> },
  options: CleanOptions = {},
): Readonly<T> & CleanEnv {
  let output: any = {}
  let defaultNodeEnv = ''
  const errors: any = {}
  const varKeys = Object.keys(specs) as Array<keyof T>
  const rawNodeEnv = (env as any).NODE_ENV

  // FIXME: make this opt-in, as an exported util?
  // If validation for NODE_ENV isn't specified, use the default validation:
  // @ts-expect-error
  if (!varKeys.includes('NODE_ENV')) {
    defaultNodeEnv = validateVar({
      name: 'NODE_ENV',
      spec: str({ choices: ['development', 'test', 'production'] }),
      rawValue: rawNodeEnv || 'production',
    })
  }

  for (const k of varKeys) {
    const spec = specs[k]
    const usingDevDefault = rawNodeEnv !== 'production' && spec.hasOwnProperty('devDefault')
    const devDefault = usingDevDefault ? spec.devDefault : undefined
    // @ts-ignore FIXME
    const rawValue = env[k] ?? (devDefault === undefined ? spec.default : devDefault)

    // Default values can be anything falsy (including an explicitly set undefined), without
    // triggering validation errors:
    const usingFalsyDefault =
      (spec.hasOwnProperty('default') && spec.default === rawValue) ||
      (usingDevDefault && devDefault === rawValue)

    try {
      // @ts-ignore FIXME
      if (rawValue === testOnlySymbol) {
        throw new EnvMissingError(formatSpecDescription(spec))
      }

      if (rawValue === undefined) {
        if (!usingFalsyDefault) {
          throw new EnvMissingError(formatSpecDescription(spec))
        }

        output[k] = undefined
      } else {
        // @ts-ignore FIXME
        output[k] = validateVar({ name: k, spec, rawValue })
      }
    } catch (err) {
      if (options.reporter === null) throw err
      errors[k] = err
    }
  }

  // TODO: replace all the below with middleware: cleanedEnv => modifiedEnv

  // Provide is{Prod/Dev/Test} properties for more readable NODE_ENV checks
  // Node that isDev and isProd are just aliases to isDevelopment and isProduction
  const computedNodeEnv = defaultNodeEnv || output.NODE_ENV
  Object.defineProperties(output, {
    isDevelopment: { value: computedNodeEnv === 'development' },
    isDev: { value: computedNodeEnv === 'development' },
    isProduction: { value: computedNodeEnv === 'production' },
    isProd: { value: computedNodeEnv === 'production' },
    isTest: { value: computedNodeEnv === 'test' },
  })

  const reporter = options.reporter || defaultReporter
  reporter({ errors, env: output })

  // FIXME
  // output = require('./strictProxy')(output, env)

  return Object.freeze(output)
}

/**
 * Utility function for providing default values only when NODE_ENV=test
 *
 * For more context, see https://github.com/af/envalid/issues/32
 */
const testOnly = (defaultValueForTests: any) => {
  return process.env.NODE_ENV === 'test' ? defaultValueForTests : testOnlySymbol
}

export { cleanEnv, testOnly }
