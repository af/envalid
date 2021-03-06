/* eslint-disable no-console */
import { EnvMissingError } from './errors'
import { ReporterOptions } from './types'

// The default reporter is supports a second argument, for consumers
// who want to use it with only small customizations
type ExtraOptions<T> = {
  onError?: (errors: Partial<Record<keyof T, Error>>) => void
  logger: (output: string) => void
}

const defaultLogger = console.error.bind(console)

// Apply ANSI colors to the reporter output only if we detect that we're running in Node
const isNode = !!(typeof process === 'object' && process?.versions?.node)
const colorWith = (colorCode: string) => (str: string) =>
  isNode ? `\x1b[${colorCode}m${str}\x1b[0m` : str

const colors = {
  blue: colorWith('34'),
  white: colorWith('37'),
  yellow: colorWith('33'),
}

const RULE = colors.white('================================')

export const defaultReporter = <T = any>(
  { errors = {} }: ReporterOptions<T>,
  { onError, logger }: ExtraOptions<T> = { logger: defaultLogger },
) => {
  if (!Object.keys(errors).length) return

  const missingVarsOutput: string[] = []
  const invalidVarsOutput: string[] = []
  for (const [k, err] of Object.entries(errors)) {
    if (err instanceof EnvMissingError) {
      missingVarsOutput.push(`    ${colors.blue(k)}: ${err.message || '(required)'}`)
    } else
      invalidVarsOutput.push(
        `    ${colors.blue(k)}: ${(err as Error)?.message || '(invalid format)'}`,
      )
  }

  // Prepend "header" output for each section of the output:
  if (invalidVarsOutput.length) {
    invalidVarsOutput.unshift(` ${colors.yellow('Invalid')} environment variables:`)
  }
  if (missingVarsOutput.length) {
    missingVarsOutput.unshift(` ${colors.yellow('Missing')} environment variables:`)
  }

  const output = [
    RULE,
    invalidVarsOutput.sort().join('\n'),
    missingVarsOutput.sort().join('\n'),
    colors.yellow('\n Exiting with error code 1'),
    RULE,
  ]
    .filter(x => !!x)
    .join('\n')

  logger(output)

  if (onError) {
    onError(errors)
  } else if (isNode) {
    process.exit(1)
  } else {
    throw new TypeError('Environment validation failed')
  }
}
