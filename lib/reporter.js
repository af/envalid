/* eslint-disable no-console */

module.exports = function defaultReporter({ errors = {}, env = {} }) {
    let errOutput = ''
    for (const k in errors) {
        errOutput += `    ${k}: ${errors[k].message}`
    }

    if (errOutput) {
        const makePlural = Object.keys(errors).length > 1
        const msg = `Invalid environment variable${makePlural ? 's' : ''}:
${errOutput}
Exiting with error code 1`
        console.error(msg)
        process.exit(1)
    }
}
