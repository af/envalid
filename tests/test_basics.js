const { createGroup, assert } = require('painless')
const { cleanEnv, EnvError, EnvMissingError, str, num, testOnly } = require('..')
const { assertPassthrough } = require('./utils')
const test = createGroup()
const makeSilent = { reporter: null }

test('string passthrough', () => {
    assertPassthrough({ FOO: 'bar' }, { FOO: str() })
})

test('strict option: only specified fields are passed through', () => {
    const opts = { strict: true }
    const env = cleanEnv({ FOO: 'bar', BAZ: 'baz' }, {
        FOO: str()
    }, opts)
    assert.deepEqual(env, { FOO: 'bar' })
})

test('transformer option: allow transformation of keys', () => {
    const lowerCaseKey = (acc, [key, value]) => Object.assign(acc, { [key.toLowerCase()]: value })
    const opts = {
        transformer: i => Object
            .keys(i)
            .map(e => [e, i[e]])
            .reduce(lowerCaseKey, {})
    }
    const env = cleanEnv({ FOO: 'bar', FOO_BAR: 'baz' }, {
        FOO: str()
    }, opts)
    assert.deepEqual(env, { foo: 'bar', foo_bar: 'baz' })
})

test('missing required string field', () => {
    assert.throws(() => cleanEnv({}, { FOO: str() }, makeSilent), EnvMissingError)
})

test('output is immutable', () => {
    const env = cleanEnv({ FOO: 'bar' }, { FOO: str() })
    env.FOO = 'baz'
    assert.strictEqual(env.FOO, 'bar')
})

test('using provided default value', () => {
    const env = cleanEnv({}, {
        FOO: str({ default: 'asdf' })
    })
    assert.deepEqual(env, { FOO: 'asdf' })
})

test('default value can be blank', () => {
    const env = cleanEnv({}, {
        FOO: str({ default: '' })
    })
    assert.deepEqual(env, { FOO: '' })
})

test('devDefault', () => {
    const spec = {
        FOO: str({ devDefault: 'hi' })
    }

    // For testing/development environments, devDefault values can make fields optional:
    const env = cleanEnv({ NODE_ENV: 'test' }, spec)
    assert.deepEqual(env, { NODE_ENV: 'test', FOO: 'hi' })

    // For a production environment, the field is required:
    assert.throws(() => cleanEnv({ NODE_ENV: 'production' }, spec, makeSilent), EnvMissingError)
})

test('falsy devDefault', () => {
    // Falsy values for devDefault work the same as falsy regular defaults
    const spec = {
        FOO: str({ devDefault: '' })
    }

    const env = cleanEnv({ NODE_ENV: 'test' }, spec)
    assert.deepEqual(env, { NODE_ENV: 'test', FOO: '' })

    assert.throws(() => cleanEnv({ NODE_ENV: 'production' }, spec, makeSilent), EnvMissingError)
})

test('devDefault and default together', () => {
    const spec = {
        FOO: num({ devDefault: 3000, default: 80 })
    }

    const env = cleanEnv({ NODE_ENV: 'test' }, spec)
    assert.deepEqual(env, { NODE_ENV: 'test', FOO: 3000 })

    const prodEnv = cleanEnv({ NODE_ENV: 'production' }, spec)
    assert.deepEqual(prodEnv, { NODE_ENV: 'production', FOO: 80 })
})

test('choices field', () => {
    // Throws when the env var isn't in the given choices:
    const spec = {
        FOO: str({ choices: ['foo', 'bar', 'baz'] })
    }
    assert.throws(() => cleanEnv({}, spec, makeSilent), EnvMissingError)
    assert.throws(() => cleanEnv({ FOO: 'bad' }, spec, makeSilent), EnvError, 'not in choices')

    // Works fine when a valid choice is given
    assertPassthrough({ FOO: 'bar' }, spec)
    assertPassthrough({ FOO: 'foo' }, spec)
    assertPassthrough({ FOO: 'baz' }, spec)

    // Throws an error when `choices` is not an array
    assert.throws(() => cleanEnv({ FOO: 'hi' }, { FOO: str({ choices: 123 }) }, makeSilent),
                  Error, 'must be an array')
})

test('misconfigured spec', () => {
    // Validation throws with different error if spec is invalid
    assert.throws(() => cleanEnv({ FOO: 'asdf' }, { FOO: {} }, makeSilent), EnvError, 'Invalid spec')
})

test('NODE_ENV built-in support', () => {
    // By default, envalid will parse and accept 3 standard NODE_ENV values:
    assertPassthrough({ NODE_ENV: 'production' }, {})
    assertPassthrough({ NODE_ENV: 'development' }, {})
    assertPassthrough({ NODE_ENV: 'test' }, {})

    // Some convenience helpers are available on the cleaned env object:
    assert.strictEqual(cleanEnv({ NODE_ENV: 'production' }, {}).isProduction, true)
    assert.strictEqual(cleanEnv({ NODE_ENV: 'test' }, {}).isTest, true)
    assert.strictEqual(cleanEnv({ NODE_ENV: 'development' }, {}).isDev, true)

    // assume production if NODE_ENV is not specified:
    assert.strictEqual(cleanEnv({}, {}).isProduction, true)
    assert.strictEqual(cleanEnv({}, {}).isDev, false)
    assert.strictEqual(cleanEnv({}, {}).isTest, false)

    // Non-standard values throw an error:
    assert.throws(() => cleanEnv({ NODE_ENV: 'asdf' }, {}, makeSilent), EnvError, 'not in choices')

    // NODE_ENV should always be set. If it is un-set, isProduction & isDev
    // still use the default value:
    const unsetEnv = cleanEnv({ NODE_ENV: '' }, {})
    assert.strictEqual(unsetEnv.isProduction, true)
    assert.strictEqual(unsetEnv.isDev, false)

    // You can override the built-in NODE_ENV validation if you want
    // The built-in convenience helpers can't be overridden though.
    const customSpec = { NODE_ENV: str({ default: 'FOO' }) }
    assert.deepEqual(cleanEnv({}, customSpec), { NODE_ENV: 'FOO' })
    assert.strictEqual(cleanEnv({}, customSpec).isProduction, false)
    assert.strictEqual(cleanEnv({}, customSpec).isDev, false)
})

test('testOnly', () => {
    const processEnv = process.env.NODE_ENV
    const makeSpec = () => ({
        FOO: str({devDefault: testOnly('sup')})
    })

    // Create an env spec that has our testOnly value applied as the devDefault,
    // and then restore the original NODE_ENV
    process.env.NODE_ENV = 'test'
    const testSpec = makeSpec()
    process.env.NODE_ENV = processEnv

    const env = cleanEnv({ NODE_ENV: 'test' }, testSpec)
    assert.deepEqual(env, { NODE_ENV: 'test', FOO: 'sup' })

    assert.throws(() => cleanEnv({ NODE_ENV: 'production' }, makeSpec(), makeSilent), EnvMissingError)
    assert.throws(() => cleanEnv({ NODE_ENV: 'development' }, makeSpec(), makeSilent), EnvMissingError)
})
