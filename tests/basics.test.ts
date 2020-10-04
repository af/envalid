import { cleanEnv, str, num, testOnly } from '../src'
import { assertPassthrough } from './utils'

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

test('misconfigured spec', () => {
  // Validation throws with different error if spec is invalid
  // @ts-expect-error This misuse should be a type error
  expect(() => cleanEnv({ FOO: 'asdf' }, { FOO: {} }, makeSilent)).toThrow()
})

test('NODE_ENV built-in support', () => {
  // By default, envalid will parse and accept 3 standard NODE_ENV values:
  // TODO: should this be brought back?
  // assertPassthrough({ NODE_ENV: 'production' }, {})
  // assertPassthrough({ NODE_ENV: 'development' }, {})
  // assertPassthrough({ NODE_ENV: 'test' }, {})

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
  expect(() => cleanEnv({ NODE_ENV: 'asdf' }, {}, makeSilent)).toThrow()

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
  expect(env).toEqual({ FOO: 'sup' })

  process.env.NODE_ENV = 'production'
  expect(() => cleanEnv({}, makeSpec(), makeSilent)).toThrow()

  process.env.NODE_ENV = 'development'
  expect(() => cleanEnv({}, makeSpec(), makeSilent)).toThrow()
  process.env.NODE_ENV = processEnv
})
