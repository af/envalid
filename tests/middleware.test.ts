import { cleanEnv, customCleanEnv, str } from '../src'
import { accessorMiddleware } from '../src/middleware'

describe('customCleanEnv middleware type inference', () => {
  test('allows access to properties on the output object', () => {
    const raw = { FOO: 'bar' }
    const cleaned = customCleanEnv(raw, { FOO: str() }, (inputEnv) => ({
      ...inputEnv,
      FOO: inputEnv.FOO.toUpperCase(),
      ADDED: 123,
    }))

    expect(cleaned).toEqual({ FOO: 'BAR', ADDED: 123 })
  })

  test('flags errors on input env', () => {
    const noop = (x: unknown) => x
    const raw = { FOO: 'bar' }
    const cleaned = customCleanEnv(raw, { FOO: str() }, (inputEnv) => {
      // @ts-expect-error Inference should tell us this property is invalid
      noop(inputEnv.WRONG_NAME)
      return inputEnv
    })

    expect(cleaned).toEqual(raw)
  })
})

// Envalid v6 and below had a "strict" option, false by default, which let you access unvalidated
// properties on the cleaned env output without throwing an error. That option is no longer present
// in v7 and above, but you can emulate it by specifying your own middleware with customCleanEnv()
// and omitting the strictProxyMiddleware that is now turned on by default
describe('legacy non-strict emulation', () => {
  const nonStrictMW = accessorMiddleware

  test('allows access to unvalidated properties without runtime errors', () => {
    const raw = { FOO: 'bar' }
    const cleaned = customCleanEnv(raw, { FOO: str() }, nonStrictMW)
    expect(cleaned).toEqual({ FOO: 'bar' })

    // Without the strictProxyMiddleware enabled, you CAN still access a non-validated
    // property on the cleaned output without an error. However, if you're using TypeScript,
    // you will still get a type error unless you explicitly type the output of your middleware in
    // a really permissive way
    // @ts-expect-error Inference will tell us this property is invalid
    expect(cleaned.NOT_PRESENT).toEqual(undefined)
  })
})

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

  test('proxy allows JSON.stringify to be called on output', () => {
    const env = cleanEnv(
      { FOO: 'foo' },
      {
        FOO: str(),
      },
    )

    expect(() => JSON.stringify(env)).not.toThrow()
    expect(JSON.stringify(env)).toEqual('{"FOO":"foo"}')
  })
})
