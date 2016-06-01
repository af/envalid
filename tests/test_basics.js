const { createGroup, assert } = require('painless')
const { cleanEnv, EnvError, bool, str, num, email, url, json } = require('..')
const test = createGroup()

// Ensure that a given environment spec passes through all values from the given
// env object
const assertPassthrough = (env, spec) => {
    assert.deepEqual(cleanEnv(env, spec), env)
}

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

test('missing required string field', () => {
    assert.throws(() => cleanEnv({}, { FOO: str() }), EnvError)
})

test('using provided default value', () => {
    const env = cleanEnv({}, {
        FOO: str({ default: 'asdf' })
    })
    assert.deepEqual(env, { FOO: 'asdf' })
})

test('choices field', () => {
    // Throws when the env var isn't in the given choices:
    const spec = {
        FOO: str({ choices: ['foo', 'bar', 'baz'] })
    }
    assert.throws(() => cleanEnv({}, spec), EnvError, 'not in choices')
    assert.throws(() => cleanEnv({ FOO: 'bad' }, spec), EnvError, 'not in choices')

    // Works fine when a valid choice is given
    assertPassthrough({ FOO: 'bar' }, spec)
    assertPassthrough({ FOO: 'foo' }, spec)
    assertPassthrough({ FOO: 'baz' }, spec)

    // Throws an error when `choices` is not an array
    assert.throws(() => cleanEnv({}, { FOO: str({ choices: 123 }) }), Error, 'must be an array')
})

test('misconfigured spec', () => {
    // Validation throws with different error if spec is invalid
    assert.throws(() => cleanEnv({ FOO: 'asdf' }, { FOO: {} }), EnvError, 'Invalid spec')
})

test('bool() works with various boolean string formats', () => {
    assert.throws(() => cleanEnv({ FOO: 'asfd' }, { FOO: bool() }),
                  EnvError, 'Invalid value')

    const truthyNum = cleanEnv({ FOO: '1' }, { FOO: bool() })
    assert.deepEqual(truthyNum, { FOO: true })
    const falsyNum = cleanEnv({ FOO: '0' }, { FOO: bool() })
    assert.deepEqual(falsyNum, { FOO: false })

    const trueStr = cleanEnv({ FOO: 'true' }, { FOO: bool() })
    assert.deepEqual(trueStr, { FOO: true })
    const falseStr = cleanEnv({ FOO: 'false' }, { FOO: bool() })
    assert.deepEqual(falseStr, { FOO: false })

    const t = cleanEnv({ FOO: 't' }, { FOO: bool() })
    assert.deepEqual(t, { FOO: true })
    const f = cleanEnv({ FOO: 'f' }, { FOO: bool() })
    assert.deepEqual(f, { FOO: false })
})

test('num()', () => {
    const withNumber = cleanEnv({ FOO: '1' }, { FOO: num() })
    assert.deepEqual(withNumber, { FOO: 1 })
})

test('email()', () => {
    const spec = { FOO: email() }
    assertPassthrough({ FOO: 'foo@example.com' }, spec)
    assertPassthrough({ FOO: 'foo.bar@my.example.com' }, spec)

    assert.throws(() => cleanEnv({ FOO: 'asdf@asdf' }, spec), EnvError)
    assert.throws(() => cleanEnv({ FOO: '1' }, spec), EnvError)
})

test('json()', () => {
    const env = cleanEnv({ FOO: '{"x": 123}' }, { FOO: json() })
    assert.deepEqual(env, { FOO: {x: 123} })

    assert.throws(() => cleanEnv({ FOO: 'abc' }, { FOO: json() }), EnvError)
})

test('url()', () => {
    assertPassthrough({ FOO: 'http://foo.com' }, { FOO: url() })
    assertPassthrough({ FOO: 'http://foo.com/bar/baz' }, { FOO: url() })
    assertPassthrough({ FOO: 'custom://foo.com/bar/baz?hi=1' }, { FOO: url() })

    assert.throws(() => cleanEnv({ FOO: 'abc' }, { FOO: url() }), EnvError)
})
