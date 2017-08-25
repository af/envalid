const meant = require('meant')


const didYouMean = (scmd, commands) => {
    const bestSimilarity = meant(scmd, commands)

    if (bestSimilarity.length > 0) {
        throw new ReferenceError(`[envalid] Environment var ${scmd} not found, did you mean ${bestSimilarity.join(', ')}?`)
    }
}

/**
* Wrap the environment object with a Proxy that throws when:
* a) trying to mutate an env var
* b) trying to access an invalid (unset) env var
*
* @return {Object} - Proxied environment object with get/set traps
*/
module.exports = (envObj, originalEnv) => new Proxy(envObj, {
    get(target, name) {
        // These checks are needed because calling console.log on a
        // proxy that throws crashes the entire process. This whitelists
        // the necessary properties for `console.log(envObj)` to work.
        if (['inspect', Symbol.toStringTag].includes(name)) return envObj[name]
        if (name.toString() === 'Symbol(util.inspect.custom)') return envObj[name]

        const varExists = envObj.hasOwnProperty(name)
        if (!varExists) {
            if (originalEnv.hasOwnProperty(name)) {
                throw new ReferenceError(`[envalid] Environment accessed not found in envalid, but in the environment. Please add a validator for it: ${name}`)
            }

            didYouMean(name, Object.keys(envObj))

            throw new ReferenceError(`[envalid] Environment var not found: ${name}`)
        }

        return envObj[name]
    },

    set(target, name) {
        throw new TypeError(`[envalid] Attempt to mutate environment value: ${name}`)
    },
})
