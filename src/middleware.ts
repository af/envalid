import { Middleware } from './types'

export const strictProxyMiddleware = (envObj: object, rawEnv: object) => {
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
        // @ts-ignore FIXME
        return envObj[name]
      }

      const varExists = envObj.hasOwnProperty(name)
      if (!varExists) {
        if (rawEnv.hasOwnProperty(name)) {
          throw new ReferenceError(
            `[envalid] Env var ${name} was accessed but not validated. This var is set in the environment; please add an envalid validator for it.`,
          )
        }

        throw new ReferenceError(`[envalid] Env var not found: ${name}`)
      }

      // @ts-ignore FIXME
      return envObj[name]
    },

    set(_target, name: string) {
      throw new TypeError(`[envalid] Attempt to mutate environment value: ${name}`)
    },
  })
}

export const defaultMiddlewares: Middleware[] = [
  // @ts-ignore FIXME
  strictProxyMiddleware,
  Object.freeze,
]
