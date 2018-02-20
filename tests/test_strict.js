const fs = require('fs')
const { createGroup, assert } = require('painless')
const { cleanEnv, str, num } = require('..')
const test = createGroup()
const strictOption = { strict: true }

// assert.deepEqual() substitute for assertions on proxied strict-mode env objects
// Chai's deepEqual() performs a few checks that the Proxy chokes on, so rather than
// adding special-case code inside the proxy's get() trap, we use this custom assert
// function
const objStrictDeepEqual = (actual, desired) => {
    const desiredKeys = Object.keys(desired)
    assert.deepEqual(Object.keys(actual), desiredKeys)
    for (const k of desiredKeys) {
        assert.strictEqual(actual[k], desired[k])
    }
}

test.beforeEach(() =>
    fs.writeFileSync(
        '.env',
        `
BAR=asdfasdf
MYNUM=4
`
    )
)
test.afterEach(() => fs.unlinkSync('.env'))

test('strict option: only specified fields are passed through', () => {
    const env = cleanEnv(
        { FOO: 'bar', BAZ: 'baz' },
        {
            FOO: str()
        },
        strictOption
    )
    objStrictDeepEqual(env, { FOO: 'bar' })
})

test('.env test in strict mode', () => {
    const env = cleanEnv(
        { FOO: 'bar', BAZ: 'baz' },
        {
            MYNUM: num()
        },
        strictOption
    )
    objStrictDeepEqual(env, { MYNUM: 4 })
})

test('strict mode objects throw when invalid attrs are accessed', () => {
    const env = cleanEnv(
        { FOO: 'bar', BAZ: 'baz' },
        {
            FOO: str()
        },
        strictOption
    )
    assert.strictEqual(env.FOO, 'bar')
    assert.throws(() => env.ASDF)
})

test('strict mode objects throw when attempting to mutate', () => {
    const env = cleanEnv(
        { FOO: 'bar', BAZ: 'baz' },
        {
            FOO: str()
        },
        strictOption
    )
    assert.throws(() => (env.FOO = 'foooooo'), '[envalid] Attempt to mutate environment value: FOO')
})

test('strict mode objects throw and suggest add validator if in orig env', () => {
    const env = cleanEnv(
        { FOO: 'foo' },
        {
            BAR: str()
        },
        strictOption
    )
    assert.throws(
        () => env.FOO,
        '[envalid] Env var FOO was accessed but not validated. This var is set in the environment; please add an envalid validator for it.'
    )
})

test('strict mode objects throw and suggest typo', () => {
    const env = cleanEnv(
        {},
        {
            BAR: str()
        },
        strictOption
    )
    assert.throws(() => env.BAS, '[envalid] Env var BAS not found, did you mean BAR?')
})

test('strict mode allows `hasOwnProperty` on self', () => {
    const env = cleanEnv(
        { FOO: 'foo' },
        {
            FOO: str()
        },
        strictOption
    )

    assert.strictEqual(env.hasOwnProperty('FOO'), true)
    assert.strictEqual(env.hasOwnProperty('BAR'), false)
})

test('strict mode env object not error out on .length checks (#70)', () => {
    const env = cleanEnv(
        { FOO: 'foo' },
        {
            FOO: str()
        },
        strictOption
    )

    assert.doesNotThrow(() => env.length)
})

test('strict mode allows `then` on self', () => {
    const env = cleanEnv(
        { FOO: 'foo' },
        {
            FOO: str()
        },
        strictOption
    )

    assert.doesNotThrow(() => env.then)
})
