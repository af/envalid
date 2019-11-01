const meant = require('meant')

/**
 * Suggest similar env var(s) if possible; for use when an invalid var is accessed.
 */
const didYouMean = (scmd, commands) => {
    const bestSimilarity = meant(scmd, commands)
    const suggestion = bestSimilarity.join(', ')

    if (bestSimilarity.length > 0) {
        throw new ReferenceError(`[envalid] Env var ${scmd} not found, did you mean ${suggestion}?`)
    }
}

const inspectables = [
    'length',
    'inspect',
    'hasOwnProperty',
    Symbol.toStringTag,
    Symbol.iterator,

    // For libs that use `then` checks to see if objects are Promises (see #74):
    'then',
    // For usage with TypeScript esModuleInterop flag
    '__esModule'
]
const inspectSymbolStrings = ['Symbol(util.inspect.custom)', 'Symbol(nodejs.util.inspect.custom)']

/**
 * Wrap the environment object with a Proxy that throws when:
 * a) trying to mutate an env var
 * b) trying to access an invalid (unset) env var
 *
 * @return {Object} - Proxied environment object with get/set traps
 */
module.exports = (envObj, originalEnv) =>
    new Proxy(envObj, {
        get(target, name) {
            // These checks are needed because calling console.log on a
            // proxy that throws crashes the entire process. This whitelists
            // the necessary properties for `console.log(envObj)`, `envObj.length`,
            // `envObj.hasOwnProperty('string')` to work.
            if (inspectables.includes(name) || inspectSymbolStrings.includes(name.toString())) {
                return envObj[name]
            }

            const varExists = envObj.hasOwnProperty(name)
            if (!varExists) {
                if (originalEnv.hasOwnProperty(name)) {
                    throw new ReferenceError(
                        `[envalid] Env var ${name} was accessed but not validated. This var is set in the environment; please add an envalid validator for it.`
                    )
                }

                didYouMean(name, Object.keys(envObj))
                throw new ReferenceError(`[envalid] Env var not found: ${name}`)
            }

            return envObj[name]
        },

        set(target, name) {
            throw new TypeError(`[envalid] Attempt to mutate environment value: ${name}`)
        }
    })
