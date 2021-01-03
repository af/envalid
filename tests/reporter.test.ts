import reporter from '../src/reporter'
import { EnvError, EnvMissingError } from '../src/errors'

let logSpy: jest.SpyInstance | null = null
let exitSpy: jest.SpyInstance | null = null

describe('default reporter', () => {
  beforeEach(() => {
    logSpy = jest.spyOn(console, 'error').mockImplementation()
    exitSpy = jest.spyOn(process, 'exit').mockImplementation()
  })

  afterEach(() => {
    logSpy?.mockRestore()
    exitSpy?.mockRestore()
  })

  test('simple usage for reporting a missing variable error', () => {
    reporter({
      errors: { FOO: new EnvMissingError() },
      env: {},
    })
    expect(logSpy).toHaveBeenCalledTimes(1)

    const output = logSpy?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Missing\S+ environment variables:/)
    expect(output).toMatch(/FOO\S+/)
    expect(output).toMatch('(required)')
    expect(output).not.toMatch(/Invalid\S+ environment variables:/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('simple usage for reporting an invalid variable error', () => {
    reporter({
      errors: { FOO: new EnvError() },
      env: { FOO: 123 },
    })
    expect(logSpy).toHaveBeenCalledTimes(1)

    const output = logSpy?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Invalid\S+ environment variables:/)
    expect(output).toMatch(/FOO\S+/)
    expect(output).toMatch('(invalid format)')
    expect(output).not.toMatch(/Missing\S+ environment variables:/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('reporting an invalid variable error with a custom error message', () => {
    reporter({
      errors: { FOO: new EnvError('custom msg') },
      env: { FOO: 123 },
    })
    expect(logSpy).toHaveBeenCalledTimes(1)

    const output = logSpy?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Invalid\S+ environment variables:/)
    expect(output).toMatch(/FOO\S+/)
    expect(output).toMatch('custom msg')

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('does nothing when there are no errors', () => {
    reporter({
      errors: {},
      env: { FOO: 'great success' },
    })
    expect(logSpy).toHaveBeenCalledTimes(0)
    expect(exitSpy).toHaveBeenCalledTimes(0)
  })
})
