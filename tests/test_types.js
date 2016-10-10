const { createGroup, assert } = require('painless')
const { cleanEnv, EnvError, bool, num, email, url, json, makeValidator } = require('..')
const { assertPassthrough } = require('./utils')
const test = createGroup()
const makeSilent = { reporter: null }


test('bool() works with various boolean string formats', () => {
    assert.equal(bool().type, 'bool')
    assert.throws(() => cleanEnv({ FOO: 'asfd' }, { FOO: bool() }, makeSilent),
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

    const defaultF = cleanEnv({}, { FOO: bool({ default: false }) })
    assert.deepEqual(defaultF, { FOO: false })
})

test('num()', () => {
    assert.equal(num().type, 'num')
    const withInt = cleanEnv({ FOO: '1' }, { FOO: num() })
    assert.deepEqual(withInt, { FOO: 1 })

    const withFloat = cleanEnv({ FOO: '0.34' }, { FOO: num() })
    assert.deepEqual(withFloat, { FOO: 0.34 })

    const withExponent = cleanEnv({ FOO: '1e3' }, { FOO: num() })
    assert.deepEqual(withExponent, { FOO: 1000 })

    assert.throws(() => cleanEnv({ FOO: 'asdf' }, { FOO: num() }, makeSilent), EnvError)
})

test('email()', () => {
    assert.equal(email().type, 'email')
    const spec = { FOO: email() }
    assertPassthrough({ FOO: 'foo@example.com' }, spec)
    assertPassthrough({ FOO: 'foo.bar@my.example.com' }, spec)

    assert.throws(() => cleanEnv({ FOO: 'asdf@asdf' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: '1' }, spec, makeSilent), EnvError)
})

test('json()', () => {
    assert.equal(json().type, 'json')
    const env = cleanEnv({ FOO: '{"x": 123}' }, { FOO: json() })
    assert.deepEqual(env, { FOO: {x: 123} })

    assert.throws(() => cleanEnv({ FOO: 'abc' }, { FOO: json() }, makeSilent), EnvError)
})

test('url()', () => {
    assert.equal(url().type, 'url')
    assertPassthrough({ FOO: 'http://foo.com' }, { FOO: url() })
    assertPassthrough({ FOO: 'http://foo.com/bar/baz' }, { FOO: url() })
    assertPassthrough({ FOO: 'custom://foo.com/bar/baz?hi=1' }, { FOO: url() })

    assert.throws(() => cleanEnv({ FOO: 'abc' }, { FOO: url() }, makeSilent), EnvError)
})

test('custom types', () => {
    const alwaysFoo = makeValidator(x => 'foo')
    assert.equal(alwaysFoo().type, 'unknown')
    assert.equal(makeValidator(x => 'foo', 'some type')().type, 'some type')

    const fooEnv = cleanEnv({ FOO: 'asdf' }, { FOO: alwaysFoo() })
    assert.deepEqual(fooEnv, { FOO: 'foo' })

    const hex10 = makeValidator(x => {
        if (/^[a-f0-9]{10}$/.test(x)) return x
        throw new Error('need 10 hex chars')
    })
    assertPassthrough({ FOO: 'a0d9aacbde' }, { FOO: hex10() })
    assert.throws(() => cleanEnv({ FOO: 'abc' }, { FOO: hex10() }, makeSilent), Error, '10 hex')

    // Default values work with custom validators as well
    const withDefault = cleanEnv({}, { FOO: hex10({ default: 'abcabcabc0' }) })
    assert.deepEqual(withDefault, { FOO: 'abcabcabc0' })
})
