import type { CleanedEnvAccessors, StrictProxyMiddlewareOptions } from './types'

export const strictProxyMiddleware = <T extends object>(
  envObj: T,
  rawEnv: unknown,
  options: StrictProxyMiddlewareOptions = {},
) => {
  const { extraInspectables = [] } = options
  const inspectables = [
    'length',
    'inspect',
    'hasOwnProperty',
    'toJSON', // Allow JSON.stringify() on output. See #157
    Symbol.toStringTag,
    Symbol.iterator,

    // For jest
    'asymmetricMatch',
    'nodeType',

    // For react-refresh, see #150
    '$$typeof',

    // For libs that use `then` checks to see if objects are Promises (see #74):
    'then',
    // For usage with TypeScript esModuleInterop flag
    '__esModule',
  ]
  const inspectSymbolStrings = ['Symbol(util.inspect.custom)', 'Symbol(nodejs.util.inspect.custom)']

  return new Proxy(envObj, {
    get(target, name: string) {
      // These checks are needed because calling console.log on a
      // proxy that throws crashes the entire process. This permits access on
      // the necessary properties for `console.log(envObj)`, `envObj.length`,
      // `envObj.hasOwnProperty('string')` to work.
      if (
        inspectables.includes(name) ||
        inspectSymbolStrings.includes(name.toString()) ||
        extraInspectables.includes(name)
      ) {
        // @ts-expect-error TS doesn't like symbol types as indexers
        return target[name]
      }

      const varExists = Object.hasOwn(target, name)
      if (!varExists) {
        if (typeof rawEnv === 'object' && rawEnv?.hasOwnProperty?.(name)) {
          throw new ReferenceError(
            `[envalid] Env var ${name} was accessed but not validated. This var is set in the environment; please add an envalid validator for it.`,
          )
        }

        throw new ReferenceError(`[envalid] Env var not found: ${name}`)
      }

      return target[name as keyof T]
    },

    set(_target, name: string) {
      throw new TypeError(`[envalid] Attempt to mutate environment value: ${name}`)
    },
  })
}

export const accessorMiddleware = <T>(envObj: T, rawEnv: unknown) => {
  // Attach is{Prod/Dev/Test} properties for more readable NODE_ENV checks
  // Note that isDev and isProd are just aliases to isDevelopment and isProduction

  // @ts-ignore attempt to read NODE_ENV even if it's not in the spec
  const computedNodeEnv = envObj.NODE_ENV || rawEnv.NODE_ENV

  // If NODE_ENV is not set, assume production
  const isProd = !computedNodeEnv || computedNodeEnv === 'production'

  Object.defineProperties(envObj, {
    isDevelopment: { value: computedNodeEnv === 'development' },
    isDev: { value: computedNodeEnv === 'development' },
    isProduction: { value: isProd },
    isProd: { value: isProd },
    isTest: { value: computedNodeEnv === 'test' },
  })
  return envObj as T & CleanedEnvAccessors
}

export const applyDefaultMiddleware = <T>(cleanedEnv: T, rawEnv: unknown) => {
  // Note: Ideally we would declare the default middlewares in an array and apply them in series with
  // a generic pipe() function. However, a generically typed variadic pipe() appears to not be possible
  // in TypeScript as of 4.x, so we just manually apply them below. See
  // https://github.com/microsoft/TypeScript/pull/39094#issuecomment-647042984
  return strictProxyMiddleware(accessorMiddleware(cleanedEnv, rawEnv), rawEnv)
}
