import { describe, test, expect, vi, beforeEach } from 'vitest'
import { expectTypeOf } from 'expect-type'
import { cleanEnv, defaultReporter, EnvMissingError, str } from '../src'
import { formatSpecDescription } from '../src/core'

vi.mock('../src/reporter')
const mockedDefaultReporter: vi.Mock = <vi.Mock<typeof defaultReporter>>defaultReporter
mockedDefaultReporter.mockImplementation(() => {})

describe('warning option', () => {
  beforeEach(() => {
    mockedDefaultReporter.mockClear()
  })

  test('warning is recorded when the env var is missing and a default is used', () => {
    cleanEnv({}, { FOO: str({ default: 'fallback', warning: 'FOO is not set' }) })

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: 'fallback' },
      errors: {},
      warnings: { FOO: 'FOO is not set' },
    })
  })

  test('no warning is recorded when the env var is set', () => {
    cleanEnv({ FOO: 'value' }, { FOO: str({ default: 'fallback', warning: 'FOO is not set' }) })

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: 'value' },
      errors: {},
      warnings: {},
    })
  })

  test('empty string env value counts as missing', () => {
    cleanEnv({ FOO: '  ' }, { FOO: str({ default: 'fallback', warning: 'FOO is not set' }) })

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: 'fallback' },
      errors: {},
      warnings: { FOO: 'FOO is not set' },
    })
  })

  test('warning is recorded when devDefault is used', () => {
    cleanEnv(
      { NODE_ENV: 'development' },
      { FOO: str({ devDefault: 'dev-fallback', warning: 'FOO is not set' }) },
    )

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: 'dev-fallback' },
      errors: {},
      warnings: { FOO: 'FOO is not set' },
    })
  })

  test('warning is recorded when testDefault is used', () => {
    cleanEnv(
      { NODE_ENV: 'test' },
      { FOO: str({ testDefault: 'test-fallback', warning: 'FOO is not set' }) },
    )

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: 'test-fallback' },
      errors: {},
      warnings: { FOO: 'FOO is not set' },
    })
  })

  test('no warning in production when only devDefault is provided (missing var errors)', () => {
    cleanEnv(
      { NODE_ENV: 'production' },
      { FOO: str({ devDefault: 'dev-fallback', warning: 'FOO is not set' }) },
    )

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: undefined },
      errors: {
        FOO: new EnvMissingError(formatSpecDescription(str({ devDefault: 'dev-fallback' }))),
      },
      warnings: {},
    })
  })

  test('missing var without any default errors even when a warning is provided', () => {
    cleanEnv({}, { FOO: str({ warning: 'FOO is not set' }) })

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: undefined },
      errors: { FOO: new EnvMissingError(formatSpecDescription(str())) },
      warnings: {},
    })
  })

  test('default: undefined + warning allows the program to run without the env var', () => {
    cleanEnv({}, { FOO: str({ default: undefined, warning: 'FOO is not set; feature disabled' }) })

    expect(mockedDefaultReporter).toHaveBeenCalledTimes(1)
    expect(mockedDefaultReporter).toHaveBeenCalledWith({
      env: { FOO: undefined },
      errors: {},
      warnings: { FOO: 'FOO is not set; feature disabled' },
    })
  })

  test('reporter: null skips warning reporting and does not throw when only warnings exist', () => {
    const env = cleanEnv(
      {},
      { FOO: str({ default: 'fallback', warning: 'FOO is not set' }) },
      { reporter: null },
    )

    expect(mockedDefaultReporter).not.toHaveBeenCalled()
    expect(env.FOO).toEqual('fallback')
  })

  test('types: warning with default: undefined yields an optional output', () => {
    const env = cleanEnv({}, { FOO: str({ default: undefined, warning: 'FOO is not set' }) })
    expectTypeOf(env.FOO).toEqualTypeOf<string | undefined>()
  })

  test('types: warning alone keeps the output required', () => {
    const env = cleanEnv({ FOO: 'value' }, { FOO: str({ warning: 'FOO is not set' }) })
    expectTypeOf(env.FOO).toEqualTypeOf<string>()
  })
})
