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

test.beforeEach(() => fs.writeFileSync('.env', `
BAR=asdfasdf
MYNUM=4
`))
test.afterEach(() => fs.unlinkSync('.env'))


test('strict option: only specified fields are passed through', () => {
    const env = cleanEnv({ FOO: 'bar', BAZ: 'baz' }, {
        FOO: str()
    }, strictOption)
    objStrictDeepEqual(env, { FOO: 'bar' })
})

test('.env test in strict mode', () => {
    const env = cleanEnv({ FOO: 'bar', BAZ: 'baz' }, {
        MYNUM: num()
    }, strictOption)
    objStrictDeepEqual(env, { MYNUM: 4 })
})

test('strict mode objects throw when invalid attrs are accessed', () => {
    const env = cleanEnv({ FOO: 'bar', BAZ: 'baz' }, {
        FOO: str()
    }, strictOption)
    assert.strictEqual(env.FOO, 'bar')
    assert.throws(() => env.ASDF)
})

test('strict mode objects throw when attempting to mutate', () => {
    const env = cleanEnv({ FOO: 'bar', BAZ: 'baz' }, {
        FOO: str()
    }, strictOption)
    assert.throws(() => env.FOO = 'foooooo')
})

