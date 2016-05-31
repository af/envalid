const { createGroup, assert } = require('painless')
const { cleanEnv, EnvError, toBool, toNumber } = require('..')
const test = createGroup()


test('string passthrough', () => {
    const env = cleanEnv({ FOO: 'bar' }, {
        FOO: {}
    })
    assert.deepEqual(env, { FOO: 'bar' })
})

test('strict option: only specified fields are passed through', () => {
    const opts = { strict: true }
    const env = cleanEnv({ FOO: 'bar', BAZ: 'baz' }, {
        FOO: {}
    }, opts)
    assert.deepEqual(env, { FOO: 'bar' })
})

test('missing required string field', () => {
    assert.throws(() => cleanEnv({}, { FOO: {} }), EnvError)
})

test('using provided default value', () => {
    const env = cleanEnv({}, {
        FOO: { default: 'asdf' }
    })
    assert.deepEqual(env, { FOO: 'asdf' })
})

test('choices field', () => {
    // Throws when the env var isn't in the given choices:
    const spec = {
        FOO: { choices: ['foo', 'bar', 'baz'] }
    }
    assert.throws(() => cleanEnv({}, spec), EnvError, 'not in choices')

    // Works fine when a valid choice is given
    const env = cleanEnv({ FOO: 'bar' }, spec)
    assert.deepEqual(env, { FOO: 'bar' })

    // Throws an error when `choices` is not an array
    assert.throws(() => cleanEnv({}, { FOO: { choices: 123 } }), Error, 'must be an array')
})

test('parse functions', () => {
    // Parse function output is used for the env var
    const replaced = cleanEnv({ FOO: 'bar' }, {
        FOO: { parse: () => 'parsed' }
    })
    assert.deepEqual(replaced, { FOO: 'parsed' })

    // Parse fn can modify a passed in env var
    const modified = cleanEnv({ FOO: 'bar.baz' }, {
        FOO: { parse: x => x.split('.')[0] }
    })
    assert.deepEqual(modified, { FOO: 'bar' })

    // Validation throws with different error if parse fn returns null
    assert.throws(() => cleanEnv({ FOO: 'asdf' }, {
        FOO: { parse: () => null }
    }), EnvError, 'Invalid value')

    // toBoolean works as a parse fn
    assert.throws(() => cleanEnv({ FOO: 'asfd' }, {
        FOO: { parse: toBool }
    }), EnvError, 'Invalid value')

    const withBool = cleanEnv({ FOO: '1' }, {
        FOO: { parse: toBool }
    })
    assert.deepEqual(withBool, { FOO: true })

    const withNumber = cleanEnv({ FOO: '1' }, {
        FOO: { parse: toNumber }
    })
    assert.deepEqual(withNumber, { FOO: 1 })
})
