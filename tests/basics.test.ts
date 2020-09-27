import { cleanEnv, EnvError, EnvMissingError, str, num, testOnly } from '../src'
import { assertPassthrough } from './utils'

const makeSilent = { reporter: null }

test('string passthrough', () => {
  assertPassthrough({ FOO: 'bar' }, { FOO: str() })
})

test('missing required string field', () => {
  expect(() => cleanEnv({}, { FOO: str() }, makeSilent)).toThrow(EnvMissingError)
})

test('output is immutable', () => {
  const env = cleanEnv({ FOO: 'bar' }, { FOO: str() })
  // @ts-expect-error This misuse should be a type error
  env.FOO = 'baz'
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
  const env = cleanEnv({ NODE_ENV: 'test' }, {
    FOO: str({ devDefault: undefined }),
  })
  expect(env).toEqual({ NODE_ENV: 'test', FOO: undefined })
})

test('devDefault', () => {
  const spec = {
    FOO: str({ devDefault: 'hi' }),
  }

  // For testing/development environments, devDefault values can make fields optional:
  const env = cleanEnv({ NODE_ENV: 'test' }, spec)
  expect(env).toEqual({ NODE_ENV: 'test', FOO: 'hi' })

  // For a production environment, the field is required:
  expect(() => cleanEnv({ NODE_ENV: 'production' }, spec, makeSilent)).toThrow(
    EnvMissingError,
  )
})

test('falsy devDefault', () => {
  // Falsy values for devDefault work the same as falsy regular defaults
  const spec = {
    FOO: str({ devDefault: '' }),
  }

  const env = cleanEnv({ NODE_ENV: 'test' }, spec)
  expect(env).toEqual({ NODE_ENV: 'test', FOO: '' })

  expect(() => cleanEnv({ NODE_ENV: 'production' }, spec, makeSilent)).toThrow(
    EnvMissingError,
  )
})

test('devDefault and default together', () => {
  const spec = {
    FOO: num({ devDefault: 3000, default: 80 }),
  }

  const env = cleanEnv({ NODE_ENV: 'test' }, spec)
  expect(env).toEqual({ NODE_ENV: 'test', FOO: 3000 })

  const prodEnv = cleanEnv({ NODE_ENV: 'production' }, spec)
  expect(prodEnv).toEqual({ NODE_ENV: 'production', FOO: 80 })
})

test('choices field', () => {
  // Throws when the env var isn't in the given choices:
  const spec = {
    FOO: str({ choices: ['foo', 'bar', 'baz'] }),
  }
  expect(() => cleanEnv({}, spec, makeSilent)).toThrow(EnvMissingError)
  expect(() => cleanEnv({ FOO: 'bad' }, spec, makeSilent)).toThrow(EnvError)

  // Works fine when a valid choice is given
  assertPassthrough({ FOO: 'bar' }, spec)
  assertPassthrough({ FOO: 'foo' }, spec)
  assertPassthrough({ FOO: 'baz' }, spec)

  // Throws an error when `choices` is not an array
  // @ts-expect-error This misuse should be a type error
  expect(() => cleanEnv({ FOO: 'hi' }, { FOO: str({ choices: 123 }) }, makeSilent)).toThrow(Error)
})

test('misconfigured spec', () => {
  // Validation throws with different error if spec is invalid
  // @ts-expect-error This misuse should be a type error
  expect(() => cleanEnv({ FOO: 'asdf' }, { FOO: {} }, makeSilent)).toThrow(EnvError)
})

test('NODE_ENV built-in support', () => {
  // By default, envalid will parse and accept 3 standard NODE_ENV values:
  assertPassthrough({ NODE_ENV: 'production' }, {})
  assertPassthrough({ NODE_ENV: 'development' }, {})
  assertPassthrough({ NODE_ENV: 'test' }, {})

  // Some convenience helpers are available on the cleaned env object:
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

  // Non-standard values throw an error:
  expect(() => cleanEnv({ NODE_ENV: 'asdf' }, {}, makeSilent)).toThrow(EnvError)

  // NODE_ENV should always be set. If it is un-set, isProduction & isDev
  // still use the default value:
  const unsetEnv = cleanEnv({ NODE_ENV: '' }, {})
  expect(unsetEnv.isProduction).toEqual(true)
  expect(unsetEnv.isProd).toEqual(true)
  expect(unsetEnv.isDev).toEqual(false)
  expect(unsetEnv.isDevelopment).toEqual(false)

  // You can override the built-in NODE_ENV validation if you want
  // The built-in convenience helpers can't be overridden though.
  const customSpec = { NODE_ENV: str({ default: 'FOO' }) }
  expect(cleanEnv({}, customSpec)).toEqual({ NODE_ENV: 'FOO' })
  expect(cleanEnv({}, customSpec).isProduction).toEqual(false)
  expect(cleanEnv({}, customSpec).isProd).toEqual(false)
  expect(cleanEnv({}, customSpec).isDev).toEqual(false)
  expect(cleanEnv({}, customSpec).isDevelopment).toEqual(false)
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
  expect(env).toEqual({ NODE_ENV: 'test', FOO: 'sup' })

  expect(() => cleanEnv({ NODE_ENV: 'production' }, makeSpec(), makeSilent)).toThrow(
    EnvMissingError,
  )
  expect(() => cleanEnv({ NODE_ENV: 'development' }, makeSpec(), makeSilent)).toThrow(
    EnvMissingError,
  )
})
