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

test('choices field', () => {
    // Throws when the env var isn't in the given choices:
    const spec = {
        FOO: { choices: ['foo', 'bar', 'baz'] }
    }
    assert.throws(() => lockEnv({}, spec), EnvError, 'not in choices')

    // Works fine when a valid choice is given
    const env = lockEnv({ FOO: 'bar' }, spec)
    assert.deepEqual(env, { FOO: 'bar' })

    // Throws an error when `choices` is not an array
    assert.throws(() => lockEnv({}, { FOO: { choices: 123 } }), Error, 'must be an array')
})
