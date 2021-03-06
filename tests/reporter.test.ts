import { defaultReporter as mainReporterExport } from '../src'
import { defaultReporter } from '../src/reporter'
import { EnvError, EnvMissingError } from '../src/errors'

let logger: jest.MockedFunction<any>
let exitSpy: jest.SpyInstance | null = null

describe('default reporter', () => {
  beforeEach(() => {
    logger = jest.fn()
    exitSpy = jest.spyOn(process, 'exit').mockImplementation()
  })

  afterEach(() => {
    exitSpy?.mockRestore()
  })

  test('default reporter should be exported from the top-level module', () => {
    expect(mainReporterExport).toEqual(defaultReporter)
  })

  test('simple usage for reporting a missing variable error', () => {
    defaultReporter({
      errors: { FOO: new EnvMissingError() },
      env: {},
    }, { logger })
    expect(logger).toHaveBeenCalledTimes(1)

    const output = logger?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Missing\S+ environment variables:/)
    expect(output).toMatch(/FOO\S+/)
    expect(output).toMatch('(required)')
    expect(output).not.toMatch(/Invalid\S+ environment variables:/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('simple usage for reporting an invalid variable error', () => {
    defaultReporter({
      errors: { FOO: new EnvError() },
      env: { FOO: 123 },
    }, { logger })
    expect(logger).toHaveBeenCalledTimes(1)

    const output = logger?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Invalid\S+ environment variables:/)
    expect(output).toMatch(/FOO\S+/)
    expect(output).toMatch('(invalid format)')
    expect(output).not.toMatch(/Missing\S+ environment variables:/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('reporting an invalid variable error with a custom error message', () => {
    defaultReporter({
      errors: { FOO: new EnvError('custom msg') },
      env: { FOO: 123 },
    }, { logger })
    expect(logger).toHaveBeenCalledTimes(1)

    const output = logger?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Invalid\S+ environment variables:/)
    expect(output).toMatch(/FOO\S+/)
    expect(output).toMatch('custom msg')

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('does nothing when there are no errors', () => {
    defaultReporter({
      errors: {},
      env: { FOO: 'great success' },
    }, { logger })
    expect(logger).toHaveBeenCalledTimes(0)
    expect(exitSpy).toHaveBeenCalledTimes(0)
  })
})
