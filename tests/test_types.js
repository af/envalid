const { createGroup, assert } = require('painless')
const { cleanEnv, EnvError, bool, num, email, url, json } = require('..')
const { assertPassthrough } = require('./utils')
const test = createGroup()


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
