import { Middleware } from './types'

export const strictProxyMiddleware = <T extends object>(
  envObj: T,
  rawEnv: Record<keyof T, string>,
) => {
  const inspectables = [
    'length',
    'inspect',
    'hasOwnProperty',
    Symbol.toStringTag,
    Symbol.iterator,

    // For jest
    'asymmetricMatch',
    'nodeType',

    // For libs that use `then` checks to see if objects are Promises (see #74):
    'then',
    // For usage with TypeScript esModuleInterop flag
    '__esModule',
  ]
  const inspectSymbolStrings = ['Symbol(util.inspect.custom)', 'Symbol(nodejs.util.inspect.custom)']

  return new Proxy(envObj, {
    get(_target, name: string) {
      // These checks are needed because calling console.log on a
      // proxy that throws crashes the entire process. This permits access on
      // the necessary properties for `console.log(envObj)`, `envObj.length`,
      // `envObj.hasOwnProperty('string')` to work.
      if (inspectables.includes(name) || inspectSymbolStrings.includes(name.toString())) {
        // @ts-expect-error TS doesn't like symbol types as indexers
        return envObj[name]
      }

      const varExists = envObj.hasOwnProperty(name)
      if (!varExists) {
        if (typeof rawEnv === 'object' && rawEnv?.hasOwnProperty?.(name)) {
          throw new ReferenceError(
            `[envalid] Env var ${name} was accessed but not validated. This var is set in the environment; please add an envalid validator for it.`,
          )
        }

        throw new ReferenceError(`[envalid] Env var not found: ${name}`)
      }

      return envObj[name as keyof T]
    },

    set(_target, name: string) {
      throw new TypeError(`[envalid] Attempt to mutate environment value: ${name}`)
    },
  })
}

export const accessorMiddleware = <T>(envObj: T, rawEnv: T) => {
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
  return envObj
}

export const defaultMiddlewares = [
  accessorMiddleware,
  strictProxyMiddleware,
  Object.freeze,
] as Middleware<unknown>[]
