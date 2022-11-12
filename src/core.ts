import { EnvError, EnvMissingError } from './errors'
import { CleanOptions, FromSpecsRecord, Spec, ValidatorSpec } from './types'
import { defaultReporter } from './reporter'

export const testOnlySymbol = Symbol('envalid - test only')

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
  rawValue: string | T
  spec: ValidatorSpec<T>
}) {
  if (typeof spec._parse !== 'function') {
    throw new EnvError(`Invalid spec for "${name}"`)
  }
  const value = spec._parse(rawValue as string)

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
  return `${spec.desc}${egText}${docsText}`
}

const readRawEnvValue = <T>(env: unknown, k: keyof T | 'NODE_ENV'): string | T[keyof T] => {
  return (env as any)[k]
}

const isTestOnlySymbol = (value: any): value is symbol => value === testOnlySymbol

/**
 * Perform the central validation/sanitization logic on the full environment object
 */
export function getSanitizedEnv<S>(
  environment: unknown,
  specs: S,
  options: CleanOptions<FromSpecsRecord<S>> = {},
): FromSpecsRecord<S> {
  let cleanedEnv = {} as Record<keyof S, unknown>
  const castSpecs = specs as unknown as Record<keyof S, ValidatorSpec<unknown>>
  const errors = {} as Record<keyof S, Error>
  const varKeys = Object.keys(castSpecs) as Array<keyof S>
  const rawNodeEnv = readRawEnvValue(environment, 'NODE_ENV')

  for (const k of varKeys) {
    const spec = castSpecs[k]
    const rawValue = readRawEnvValue(environment, k)

    // If no value was given and default/devDefault were provided, return the appropriate default
    // value without passing it through validation
    if (rawValue === undefined) {
      // Use devDefault values only if NODE_ENV was explicitly set, and isn't 'production'
      const usingDevDefault =
        rawNodeEnv && rawNodeEnv !== 'production' && spec.hasOwnProperty('devDefault')
      if (usingDevDefault) {
        cleanedEnv[k] = spec.devDefault
        continue
      }
      if ('default' in spec) {
        cleanedEnv[k] = spec.default
        continue
      }
    }

    try {
      if (isTestOnlySymbol(rawValue)) {
        throw new EnvMissingError(formatSpecDescription(spec))
      }

      if (rawValue === undefined) {
        cleanedEnv[k] = undefined
        throw new EnvMissingError(formatSpecDescription(spec))
      } else {
        cleanedEnv[k] = validateVar({ name: k as string, spec, rawValue })
      }
    } catch (err) {
      if (options?.reporter === null) throw err
      if (err instanceof Error) errors[k] = err
    }
  }

  const reporter = options?.reporter || defaultReporter
  reporter({ errors, env: cleanedEnv })
  return cleanedEnv as FromSpecsRecord<S>
}
