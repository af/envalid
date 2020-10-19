import { Middleware } from './types'

export const strictProxyMiddleware = <T extends object>(envObj: T, rawEnv: unknown) => {
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

export const defaultMiddlewares = [strictProxyMiddleware, Object.freeze] as Middleware<unknown>[]
