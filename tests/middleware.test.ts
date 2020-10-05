import { cleanEnv, str } from '..'

describe('proxy middleware', () => {
  test('only specified fields are passed through from validation', () => {
    const env = cleanEnv(
      { FOO: 'bar', BAZ: 'baz' },
      {
        FOO: str(),
      },
    )
    expect(env).toEqual({ FOO: 'bar' })
  })

  test('proxy throws when invalid attrs are accessed', () => {
    const env = cleanEnv(
      { FOO: 'bar', BAZ: 'baz' },
      {
        FOO: str(),
      },
    )
    expect(env.FOO).toEqual('bar')
    // @ts-expect-error This invalid usage should trigger a type error
    expect(() => env.ASDF).toThrow()
  })

  test('proxy throws when attempting to mutate', () => {
    const env = cleanEnv(
      { FOO: 'bar', BAZ: 'baz' },
      {
        FOO: str(),
      },
    )
    // @ts-expect-error This invalid usage should trigger a type error
    expect(() => (env.FOO = 'foooooo')).toThrow(
      '[envalid] Attempt to mutate environment value: FOO',
    )
  })

  test('proxy throws and suggests to add a validator if name is in orig env', () => {
    const env = cleanEnv(
      { FOO: 'foo', BAR: 'wat' },
      {
        BAR: str(),
      },
    )
    expect(
      // @ts-expect-error This invalid usage should trigger a type error
      () => env.FOO,
    ).toThrow(
      '[envalid] Env var FOO was accessed but not validated. This var is set in the environment; please add an envalid validator for it.',
    )
  })

  test('proxy allows `hasOwnProperty` on self', () => {
    const env = cleanEnv(
      { FOO: 'foo' },
      {
        FOO: str(),
      },
    )

    expect(env.hasOwnProperty('FOO')).toEqual(true)
    expect(env.hasOwnProperty('BAR')).toEqual(false)
  })

  test('proxy does not error out on .length checks (#70)', () => {
    const env = cleanEnv(
      { FOO: 'foo' },
      {
        FOO: str(),
      },
    )

    // @ts-expect-error This invalid usage should trigger a type error
    expect(() => env.length).not.toThrow()
  })

  test('proxy allows `then` on self', () => {
    const env = cleanEnv(
      { FOO: 'foo' },
      {
        FOO: str(),
      },
    )

    // @ts-expect-error This invalid usage should trigger a type error
    expect(() => env.then).not.toThrow()
  })

  test('proxy allows `__esModule` on self', () => {
    const env = cleanEnv(
      { FOO: 'foo' },
      {
        FOO: str(),
      },
    )

    // @ts-expect-error This invalid usage should trigger a type error
    expect(() => env.__esModule).not.toThrow()
  })
})
