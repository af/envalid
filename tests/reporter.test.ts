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

  test('simple usage', () => {
    reporter({
      errors: { FOO: new Error('hi') },
      env: {},
    })
    expect(logSpy).toHaveBeenCalledTimes(1)

    /*
     * FIXME: need to get at the args
    const output = logSpy.firstCall.args[0]
    expect(output).toMatch(/Invalid\S+ environment variable/)
    expect(output).toMatch(/FOO\S+: hi/)
    expect(output).not.toMatch(/Missing\S+ environment variables:/)
     */

    expect(exitSpy).toHaveBeenCalledTimes(1)
  })
})
