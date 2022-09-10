import {
  defaultReporter as mainReporterExport,
  envalidErrorFormatter as mainEnvalidErrorFormatter,
} from '../src'
import { defaultReporter, envalidErrorFormatter } from '../src/reporter'
import { EnvError, EnvMissingError } from '../src/errors'

describe('default reporter', () => {
  let logger: jest.MockedFunction<any>
  let exitSpy: jest.SpyInstance | null = null

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
    defaultReporter(
      {
        errors: { FOO: new EnvMissingError() },
        env: {},
      },
      { logger },
    )

    expect(logger).toHaveBeenCalledTimes(2)

    const output1 = logger?.mock?.calls?.[0]?.[0]
    expect(output1).toMatch(/Missing\S+ environment variables:/)
    expect(output1).toMatch(/FOO\S+/)
    expect(output1).toMatch('(required)')
    expect(output1).not.toMatch(/Invalid\S+ environment variables:/)

    const output2 = logger?.mock?.calls?.[1]?.[0]
    expect(output2).toMatch(/Exiting with error code 1/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('simple usage for reporting an invalid variable error', () => {
    defaultReporter(
      {
        errors: { FOO: new EnvError() },
        env: { FOO: 123 },
      },
      { logger },
    )
    expect(logger).toHaveBeenCalledTimes(2)

    const output1 = logger?.mock?.calls?.[0]?.[0]
    expect(output1).toMatch(/Invalid\S+ environment variables:/)
    expect(output1).toMatch(/FOO\S+/)
    expect(output1).toMatch('(invalid format)')
    expect(output1).not.toMatch(/Missing\S+ environment variables:/)

    const output2 = logger?.mock?.calls?.[1]?.[0]
    expect(output2).toMatch(/Exiting with error code 1/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('reporting an invalid variable error with a custom error message', () => {
    defaultReporter(
      {
        errors: { FOO: new EnvError('custom msg') },
        env: { FOO: 123 },
      },
      { logger },
    )
    expect(logger).toHaveBeenCalledTimes(2)

    const output1 = logger?.mock?.calls?.[0]?.[0]
    expect(output1).toMatch(/Invalid\S+ environment variables:/)
    expect(output1).toMatch(/FOO\S+/)
    expect(output1).toMatch('custom msg')

    const output2 = logger?.mock?.calls?.[1]?.[0]
    expect(output2).toMatch(/Exiting with error code 1/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('does nothing when there are no errors', () => {
    defaultReporter(
      {
        errors: {},
        env: { FOO: 'great success' },
      },
      { logger },
    )
    expect(logger).toHaveBeenCalledTimes(0)
    expect(exitSpy).toHaveBeenCalledTimes(0)
  })
})

describe('envalidErrorFormatter', () => {
  let logger: jest.MockedFunction<any>

  beforeEach(() => {
    logger = jest.fn()
  })

  test('default formatter should be exported from the top-level module', () => {
    expect(mainEnvalidErrorFormatter).toEqual(envalidErrorFormatter)
  })

  test('simple usage for formatting a single error', () => {
    expect(logger).toHaveBeenCalledTimes(0)
    envalidErrorFormatter({ FOO: new EnvMissingError() }, logger)
    expect(logger).toHaveBeenCalledTimes(1)

    const output = logger?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Missing\S+ environment variables:/)
    expect(output).toMatch(/FOO\S+/)
    expect(output).toMatch('(required)')
  })
})
