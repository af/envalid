const { createGroup, assert } = require('painless')
const { lockEnv, EnvError } = require('..')
const test = createGroup()


test('string passthrough', () => {
    const env = lockEnv({ FOO: 'bar' }, {
        FOO: {}
    })
    assert.deepEqual(env, { FOO: 'bar' })
})

test('strict option: only specified fields are passed through', () => {
    const opts = { strict: true }
    const env = lockEnv({ FOO: 'bar', BAZ: 'baz' }, {
        FOO: {}
    }, opts)
    assert.deepEqual(env, { FOO: 'bar' })
})

test('missing required string field', () => {
    assert.throws(() => lockEnv({}, { FOO: {} }), EnvError)
})

test('using provided default value', () => {
    const env = lockEnv({}, {
        FOO: { default: 'asdf' }
    })
    assert.deepEqual(env, { FOO: 'asdf' })
})
