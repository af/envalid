import { cleanEnv, str, num, testOnly } from '../src'
import { assertPassthrough } from './utils'
import { expectTypeOf } from 'expect-type'

const makeSilent = { reporter: null }

test('string passthrough', () => {
  assertPassthrough({ FOO: 'bar' }, { FOO: str() })
})

test('missing required string field', () => {
  expect(() => cleanEnv({}, { FOO: str() }, makeSilent)).toThrow()
})

test('output is immutable', () => {
  const env = cleanEnv({ FOO: 'bar' }, { FOO: str() })
  // @ts-expect-error This misuse should be a type error
  expect(() => (env.FOO = 'baz')).toThrow()
  expect(env.FOO).toEqual('bar')
})

test('using provided default value', () => {
  const env = cleanEnv(
    {},
    {
      FOO: str({ default: 'asdf' }),
    },
  )
  expect(env).toEqual({ FOO: 'asdf' })
})

test('default value can be blank', () => {
  const env = cleanEnv(
    {},
    {
      FOO: str({ default: '' }),
    },
  )
  expect(env).toEqual({ FOO: '' })
})

test('default set to undefined', () => {
  const env = cleanEnv(
    {},
    {
      FOO: str({ default: undefined }),
    },
  )
  expect(env).toEqual({ FOO: undefined })
})

test('devDefault set to undefined', () => {
  const env = cleanEnv(
    { NODE_ENV: 'test' },
    {
      FOO: str({ devDefault: undefined }),
    },
  )
  expect(env).toEqual({ FOO: undefined })
})

test('devDefault', () => {
  const spec = {
    FOO: str({ devDefault: 'hi' }),
  }

  // For testing/development environments, devDefault values can make fields optional:
  const env = cleanEnv({ NODE_ENV: 'test' }, spec)
  expect(env).toEqual({ FOO: 'hi' })

  // For a production environment, the field is required:
  expect(() => cleanEnv({ NODE_ENV: 'production' }, spec, makeSilent)).toThrow()

  // If NODE_ENV is not set, devDefault should not be used and validation should fail if the
  // env var was not provided (issue #65)
  expect(() => cleanEnv({ NODE_ENV: undefined }, spec, makeSilent)).toThrow()
})

test('falsy devDefault', () => {
  // Falsy values for devDefault work the same as falsy regular defaults
  const spec = {
    FOO: str({ devDefault: '' }),
  }

  const env = cleanEnv({ NODE_ENV: 'test' }, spec)
  expect(env).toEqual({ FOO: '' })

  expect(() => cleanEnv({ NODE_ENV: 'production' }, spec, makeSilent)).toThrow()
})

test('devDefault and default together', () => {
  const spec = {
    FOO: num({ devDefault: 3000, default: 80 }),
  }

  const env = cleanEnv({ NODE_ENV: 'test' }, spec)
  expect(env).toEqual({ FOO: 3000 })

  const prodEnv = cleanEnv({ NODE_ENV: 'production' }, spec)
  expect(prodEnv).toEqual({ FOO: 80 })
})

test('multiple devDefault', () => {
  const env = cleanEnv(
    { NODE_ENV: 'test' },
    {
      NODE_ENV: str({ choices: ['development', 'test', 'production'], devDefault: 'development' }),
      RUNTIME_ENV: str({
        choices: ['local', 'staging', 'production'],
        devDefault: 'local',
      }),
      SUBDOMAIN: str({ devDefault: 'envalid' }),
    },
  )

  expect(env.SUBDOMAIN).toBe('envalid')
})

test('choices field', () => {
  // Throws when the env var isn't in the given choices:
  const spec = {
    FOO: str({ choices: ['foo', 'bar', 'baz'] }),
  }
  expect(() => cleanEnv({}, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: 'bad' }, spec, makeSilent)).toThrow()

  // Works fine when a valid choice is given
  assertPassthrough({ FOO: 'bar' }, spec)
  assertPassthrough({ FOO: 'foo' }, spec)
  assertPassthrough({ FOO: 'baz' }, spec)

  // Throws an error when `choices` is not an array
  // @ts-expect-error This misuse should be a type error
  expect(() => cleanEnv({ FOO: 'hi' }, { FOO: str({ choices: 123 }) }, makeSilent)).toThrow()
})

test('choices should refine the type of the field to a union', () => {
  type NodeEnvType = 'production' | 'test' | 'development'

  const env = cleanEnv(
    { NODE_ENV: 'test' },
    {
      NODE_ENV: str({ choices: ['production', 'test', 'development'] }),
      WITH_DEFAULT: str({ choices: ['production', 'test', 'development'], default: 'production' }),
    },
  )

  // type of the output should be the union type, not the more generic `string`
  const nodeEnv: NodeEnvType = env.NODE_ENV
  const withDefault: NodeEnvType = env.WITH_DEFAULT

  // @ts-expect-error specifying a type that doesn't match the choices union type should cause an error
  const shouldFail: 'test' | 'wrong' = env.NODE_ENV

  expect(nodeEnv).toEqual('test')
  expect(withDefault).toEqual('production')
})

test('misconfigured spec', () => {
  // Validation throws with different error if spec is invalid
  expect(() => {
    expectTypeOf(cleanEnv({ FOO: 'asdf' }, { FOO: {} }, makeSilent)).toBeNever()
  }).toThrow()
})

describe('NODE_ENV built-in support', () => {
  // By default, envalid will NO LONGER validate and return a NODE_ENV value by default
  // (this was changed in v7). You need to create your own NODE_ENV validation if you want this to
  // happen.
  //
  // The isProduction/isTest/isDev properties are still supported out of the box for
  // 'production'/'test'/'development', respectively
  test('no longer validates NODE_ENV by default', () => {
    expect(cleanEnv({ NODE_ENV: 'production' }, {})).toEqual({})
    expect(cleanEnv({ NODE_ENV: 'development' }, {})).toEqual({})
    expect(cleanEnv({ NODE_ENV: 'test' }, {})).toEqual({})

    // Non-standard values DO NOT throw an error (this changed in v7 to allow custom NODE_ENV values):
    expect(() => cleanEnv({ NODE_ENV: 'staging' }, {})).not.toThrow()
  })

  test('allows you to use your own NODE_ENV validator with ad-hoc values', () => {
    const spec = {
      NODE_ENV: str({ choices: ['development', 'test', 'production', 'staging'] }),
    }
    expect(cleanEnv({ NODE_ENV: 'staging' }, spec)).toEqual({ NODE_ENV: 'staging' })

    // Validation fails with our choices field when we pass in a value that doesn't match
    expect(() => cleanEnv({ NODE_ENV: 'BAD' }, spec, makeSilent)).toThrow()
  })

  // Some convenience helpers are available on the cleaned env object:
  test('accessor helpers via middleware work as expected', () => {
    expect(cleanEnv({ NODE_ENV: 'production' }, {}).isProduction).toEqual(true)
    expect(cleanEnv({ NODE_ENV: 'production' }, {}).isProd).toEqual(true)
    expect(cleanEnv({ NODE_ENV: 'test' }, {}).isTest).toEqual(true)
    expect(cleanEnv({ NODE_ENV: 'development' }, {}).isDev).toEqual(true)
    expect(cleanEnv({ NODE_ENV: 'development' }, {}).isDevelopment).toEqual(true)

    // assume production if NODE_ENV is not specified:
    expect(cleanEnv({}, {}).isProduction).toEqual(true)
    expect(cleanEnv({}, {}).isProd).toEqual(true)
    expect(cleanEnv({}, {}).isDev).toEqual(false)
    expect(cleanEnv({}, {}).isDevelopment).toEqual(false)
    expect(cleanEnv({}, {}).isTest).toEqual(false)

    // If NODE_ENV is un-set, isProduction & isDev still use the default value:
    const unsetEnv = cleanEnv({ NODE_ENV: '' }, {})
    expect(unsetEnv.isProduction).toEqual(true)
    expect(unsetEnv.isProd).toEqual(true)
    expect(unsetEnv.isDev).toEqual(false)
    expect(unsetEnv.isDevelopment).toEqual(false)
  })

  test('providing a custom NODE_ENV validator works as expected', () => {
    // You can override the built-in NODE_ENV validation if you want
    // The built-in convenience helpers can't be overridden though.
    const customSpec = { NODE_ENV: str({ default: 'FOO' }) }
    expect(cleanEnv({}, customSpec)).toEqual({ NODE_ENV: 'FOO' })
    expect(cleanEnv({}, customSpec).isProduction).toEqual(false)
    expect(cleanEnv({}, customSpec).isProd).toEqual(false)
    expect(cleanEnv({}, customSpec).isDev).toEqual(false)
    expect(cleanEnv({}, customSpec).isDevelopment).toEqual(false)
  })
})

test('testOnly', () => {
  const processEnv = process.env.NODE_ENV
  const makeSpec = () => ({
    FOO: str({ devDefault: testOnly('sup') }),
  })

  // Create an env spec that has our testOnly value applied as the devDefault,
  // and then restore the original NODE_ENV
  process.env.NODE_ENV = 'test'
  const testSpec = makeSpec()
  process.env.NODE_ENV = processEnv

  const env = cleanEnv({ NODE_ENV: 'test' }, testSpec)
  expect(env).toEqual({ FOO: 'sup' })

  process.env.NODE_ENV = 'production'
  expect(() => cleanEnv({ NODE_ENV: 'production' }, makeSpec(), makeSilent)).toThrow()

  process.env.NODE_ENV = 'development'
  expect(() => cleanEnv({ NODE_ENV: 'development' }, makeSpec(), makeSilent)).toThrow()
  process.env.NODE_ENV = processEnv
})
