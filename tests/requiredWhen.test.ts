import { bool, cleanEnv, defaultReporter, EnvMissingError, num, EnvError } from '../src'
import { formatSpecDescription } from '../src/core'

jest.mock('../src/reporter')
const mockedDefaultReporter: jest.Mock = <jest.Mock<typeof defaultReporter>>defaultReporter;
mockedDefaultReporter.mockImplementation(() => { })

describe('requiredWhen', () => {
  beforeEach(() => {
    mockedDefaultReporter.mockClear()
  })
  test("isn't required", () => {
    cleanEnv(
      {
        autoExtractId: "true",
      },
      {
        autoExtractId: bool(),
        id: num({
          default: undefined,
          requiredWhen: (cleanedEnv) => !cleanedEnv['autoExtractId'],
        }),
      },
    )
    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: {
        autoExtractId: true,
        id: undefined,
      },
      errors: {}
    })
  })

  test('required but not provided', () => {
    cleanEnv(
      {
        autoExtractId: "false",
      },
      {
        autoExtractId: bool(),
        id: num({
          default: undefined,
          requiredWhen: (cleanedEnv) => !cleanedEnv['autoExtractId'],
        }),
      },
    )
    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: {
        autoExtractId: false,
        id: undefined,
      },
      errors: {
        id: new EnvMissingError(
          formatSpecDescription(
            num({
              default: undefined,
              requiredWhen: (cleanedEnv) => !cleanedEnv['autoExtractId'],
            }),
          ),
        ),
      },
    })
  })

  test('required and provided', () => {
    cleanEnv(
      {
        autoExtractId: "false",
        id: "123"
      },
      {
        autoExtractId: bool(),
        id: num({
          default: undefined,
          requiredWhen: (cleanedEnv) => !cleanedEnv['autoExtractId'],
        }),
      },
    )
    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: {
        autoExtractId: false,
        id: 123,
      },
      errors: {},
    })
  })

  test('required but failed to parse', () => {
    cleanEnv(
      {
        autoExtractId: "false",
        id: "abc"
      },
      {
        autoExtractId: bool(),
        id: num({
          default: undefined,
          requiredWhen: (cleanedEnv) => !cleanedEnv['autoExtractId'],
        }),
      },
    )
    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: {
        autoExtractId: false,
        id: undefined,
      },
      errors: {
        id: new EnvError(`Invalid number input: "abc"`)
      },
    })
  })
})
