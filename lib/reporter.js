/* eslint-disable no-console */
const { EnvMissingError } = require('./validators')

module.exports = function defaultReporter({ errors = {}, env = {} }) {
    const errorKeys = Object.keys(errors)
    if (!errorKeys.length) return

    const missingVarsOutput = []
    const invalidVarsOutput = []
    for (const k of errorKeys) {
        const err = errors[k]
        if (err instanceof EnvMissingError) missingVarsOutput.push(`    ${k}: ${errors[k].message}`)
        else invalidVarsOutput.push(`    ${k}: ${errors[k].message}`)
    }

    // Prepend "header" output for each section of the output:
    if (invalidVarsOutput.length) invalidVarsOutput.unshift('Invalid environment variables:')
    if (missingVarsOutput.length) missingVarsOutput.unshift('Missing environment variables:')

    const msg = `=====
${invalidVarsOutput.join('\n')}
${missingVarsOutput.join('\n')}
Exiting with error code 1
=====
`
    console.error(msg)
    process.exit(1)
}
