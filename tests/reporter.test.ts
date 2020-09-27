import reporter from '../src/reporter'

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

  test('simple usage for reporting an error', () => {
    reporter({
      errors: { FOO: new Error('hi') },
      env: {},
    })
    expect(logSpy).toHaveBeenCalledTimes(1)

    const output = logSpy?.mock?.calls?.[0]?.[0]
    expect(output).toMatch(/Invalid\S+ environment variable/)
    expect(output).toMatch(/FOO\S+: hi/)
    expect(output).not.toMatch(/Missing\S+ environment variables:/)

    expect(exitSpy).toHaveBeenCalledTimes(1)
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('does nothing when there are no errors', () => {
    reporter({
      errors: {},
      env: { FOO: 'great success'},
    })
    expect(logSpy).toHaveBeenCalledTimes(0)
    expect(exitSpy).toHaveBeenCalledTimes(0)
  })
})
