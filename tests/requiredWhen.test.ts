// let defaultReporter: jest.Mock = jest.fn().mockImplementation(() => {})
// jest.mock('../src/reporter.ts', () => {
//   return {
//     defaultReporter: defaultReporter,
//   }
// })
import { bool, cleanEnv, defaultReporter, EnvMissingError, Spec, num, EnvError } from '../src'
jest.mock('../src/reporter')
const mockedDefaultReporter: jest.Mock = <jest.Mock<typeof defaultReporter>> defaultReporter;
mockedDefaultReporter.mockImplementation((a) => {console.log(a)})
describe('required when', () => {
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

  test("required but not provided", () => {
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

  test("required and provided", () => {
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
  
  test("required but failed to parse", () => {
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
function formatSpecDescription<T>(spec: Spec<T>) {
  const egText = spec.example ? ` (eg. "${spec.example}")` : ''
  const docsText = spec.docs ? `. See ${spec.docs}` : ''
  return `${spec.desc}${egText}${docsText}`
}
