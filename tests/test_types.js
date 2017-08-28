const { createGroup, assert } = require('painless')
const {
    cleanEnv,
    EnvError,
    makeValidator,
    str,
    bool,
    num,
    email,
    host,
    port,
    url,
    json
} = require('..')
const { assertPassthrough } = require('./utils')
const test = createGroup()
const makeSilent = { reporter: null }

test('bool() works with various formats', () => {
    assert.equal(bool().type, 'bool')
    assert.throws(
        () => cleanEnv({ FOO: 'asfd' }, { FOO: bool() }, makeSilent),
        EnvError,
        'Invalid value'
    )

    const trueBool = cleanEnv({ FOO: true }, { FOO: bool() })
    assert.deepEqual(trueBool, { FOO: true })
    const falseBool = cleanEnv({ FOO: false }, { FOO: bool() })
    assert.deepEqual(falseBool, { FOO: false })

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

    const withZero = cleanEnv({ FOO: 0 }, { FOO: num() })
    assert.deepEqual(withZero, { FOO: 0 })

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

test('host()', () => {
    assert.equal(host().type, 'host')
    const spec = { FOO: host() }
    assertPassthrough({ FOO: 'example.com' }, spec)
    assertPassthrough({ FOO: 'localhost' }, spec)
    assertPassthrough({ FOO: '192.168.0.1' }, spec)
    assertPassthrough({ FOO: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }, spec)

    assert.throws(() => cleanEnv({ FOO: '' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: 'example.com.' }, spec, makeSilent), EnvError)
    // https://github.com/chriso/validator.js/issues/704
    // assert.throws(() => cleanEnv({ FOO: '127.0.0' }, spec, makeSilent), EnvError)
    // assert.throws(() => cleanEnv({ FOO: '127.0.0.256' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: '2001:0db8:85a3:0000:0000' }, spec, makeSilent), EnvError)
})

test('port()', () => {
    assert.equal(port().type, 'port')
    const spec = { FOO: port() }

    const with1 = cleanEnv({ FOO: '1' }, spec)
    assert.deepEqual(with1, { FOO: 1 })
    const with80 = cleanEnv({ FOO: '80' }, spec)
    assert.deepEqual(with80, { FOO: 80 })
    const with65535 = cleanEnv({ FOO: '65535' }, spec)
    assert.deepEqual(with65535, { FOO: 65535 })

    assert.throws(() => cleanEnv({ FOO: '' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: '0' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: '65536' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: '042' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: '42.0' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: '42.42' }, spec, makeSilent), EnvError)
    assert.throws(() => cleanEnv({ FOO: 'hello' }, spec, makeSilent), EnvError)
})

test('json()', () => {
    assert.equal(json().type, 'json')
    const env = cleanEnv({ FOO: '{"x": 123}' }, { FOO: json() })
    assert.deepEqual(env, { FOO: { x: 123 } })
    const envTrailingCommas = cleanEnv({ FOO: '{"x": 123,}' }, { FOO: json() })
    assert.deepEqual(envTrailingCommas, { FOO: { x: 123 } })
    const envNoQuotes = cleanEnv({ FOO: '{x: 123,}' }, { FOO: json() })
    assert.deepEqual(envNoQuotes, { FOO: { x: 123 } })
    const envSingleQuotes = cleanEnv({ FOO: "{'x': 123,}" }, { FOO: json() })
    assert.deepEqual(envSingleQuotes, { FOO: { x: 123 } })
    const envNoWrappingBraces = cleanEnv({ FOO: 'x: 123,' }, { FOO: json() })
    assert.deepEqual(envNoWrappingBraces, { FOO: { x: 123 } })

    assert.throws(() => cleanEnv({ FOO: 'abc' }, { FOO: json() }, makeSilent), EnvError)
})

test('url()', () => {
    assert.equal(url().type, 'url')
    assertPassthrough({ FOO: 'http://foo.com' }, { FOO: url() })
    assertPassthrough({ FOO: 'http://foo.com/bar/baz' }, { FOO: url() })
    assertPassthrough({ FOO: 'custom://foo.com/bar/baz?hi=1' }, { FOO: url() })

    assert.throws(() => cleanEnv({ FOO: 'abc' }, { FOO: url() }, makeSilent), EnvError)
})

test('str()', () => {
    assert.equal(str().type, 'str')
    const withEmpty = cleanEnv({ FOO: '' }, { FOO: str() })
    assert.deepEqual(withEmpty, { FOO: '' })

    assert.throws(() => cleanEnv({ FOO: 42 }, { FOO: str() }, makeSilent), EnvError)
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
