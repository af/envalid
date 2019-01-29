/* eslint-disable no-console */
const { EnvMissingError } = require('./validators')
const chalk = require('chalk')
const RULE = chalk.grey('================================')

module.exports = function defaultReporter({ errors = {}, env = {} }) {
    const errorKeys = Object.keys(errors)
    if (!errorKeys.length) return

    const missingVarsOutput = []
    const invalidVarsOutput = []
    for (const k of errorKeys) {
        const err = errors[k]
        if (err instanceof EnvMissingError) {
            missingVarsOutput.push(`    ${chalk.blue(k)}: ${errors[k].message || '(required)'}`)
        } else invalidVarsOutput.push(`    ${chalk.blue(k)}: ${errors[k].message}`)
    }

    // Prepend "header" output for each section of the output:
    if (invalidVarsOutput.length) {
        invalidVarsOutput.unshift(` ${chalk.yellow('Invalid')} environment variables:`)
    }
    if (missingVarsOutput.length) {
        missingVarsOutput.unshift(` ${chalk.yellow('Missing')} environment variables:`)
    }

    const output = [
        RULE,
        invalidVarsOutput.join('\n'),
        missingVarsOutput.join('\n'),
        chalk.yellow('\n Exiting with error code 1'),
        RULE
    ]
        .filter(x => !!x)
        .join('\n')

    console.error(output)
    process.exit(1)
}
