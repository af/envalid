import { cleanEnv, makeValidator, str, bool, num, email, host, port, url, json } from '../src'
import { assertPassthrough } from './utils'

const makeSilent = { reporter: null }

test('bool() works with various formats', () => {
  expect(() => cleanEnv({ FOO: 'asfd' }, { FOO: bool() }, makeSilent)).toThrow()

  const trueBool = cleanEnv({ FOO: true }, { FOO: bool() })
  expect(trueBool).toEqual({ FOO: true })

  const falseBool = cleanEnv({ FOO: false }, { FOO: bool() })
  expect(falseBool).toEqual({ FOO: false })

  const truthyNum = cleanEnv({ FOO: '1' }, { FOO: bool() })
  expect(truthyNum).toEqual({ FOO: true })
  const falsyNum = cleanEnv({ FOO: '0' }, { FOO: bool() })
  expect(falsyNum).toEqual({ FOO: false })

  const trueStr = cleanEnv({ FOO: 'true' }, { FOO: bool() })
  expect(trueStr).toEqual({ FOO: true })

  const falseStr = cleanEnv({ FOO: 'false' }, { FOO: bool() })
  expect(falseStr).toEqual({ FOO: false })

  const t = cleanEnv({ FOO: 't' }, { FOO: bool() })
  expect(t).toEqual({ FOO: true })
  const f = cleanEnv({ FOO: 'f' }, { FOO: bool() })
  expect(f).toEqual({ FOO: false })

  const defaultF = cleanEnv({}, { FOO: bool({ default: false }) })
  expect(defaultF).toEqual({ FOO: false })
})

test('num()', () => {
  const withInt = cleanEnv({ FOO: '1' }, { FOO: num() })
  expect(withInt).toEqual({ FOO: 1 })

  const withFloat = cleanEnv({ FOO: '0.34' }, { FOO: num() })
  expect(withFloat).toEqual({ FOO: 0.34 })

  const withExponent = cleanEnv({ FOO: '1e3' }, { FOO: num() })
  expect(withExponent).toEqual({ FOO: 1000 })

  const withZero = cleanEnv({ FOO: 0 }, { FOO: num() })
  expect(withZero).toEqual({ FOO: 0 })

  expect(() => cleanEnv({ FOO: 'asdf' }, { FOO: num() }, makeSilent)).toThrow()

  expect(() => cleanEnv({ FOO: '' }, { FOO: num() }, makeSilent)).toThrow()
})

test('email()', () => {
  const spec = { FOO: email() }
  assertPassthrough({ FOO: 'foo@example.com' }, spec)
  assertPassthrough({ FOO: 'foo.bar@my.example.com' }, spec)

  expect(() => cleanEnv({ FOO: 'asdf@asdf' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: '1' }, spec, makeSilent)).toThrow()
})

test('host()', () => {
  const spec = { FOO: host() }
  assertPassthrough({ FOO: 'example.com' }, spec)
  assertPassthrough({ FOO: 'localhost' }, spec)
  assertPassthrough({ FOO: '192.168.0.1' }, spec)
  assertPassthrough({ FOO: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' }, spec)

  expect(() => cleanEnv({ FOO: '' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: 'example.com.' }, spec, makeSilent)).toThrow()
})

test('port()', () => {
  const spec = { FOO: port() }

  const with1 = cleanEnv({ FOO: '1' }, spec)
  expect(with1).toEqual({ FOO: 1 })
  const with80 = cleanEnv({ FOO: '80' }, spec)
  expect(with80).toEqual({ FOO: 80 })
  const with80Num = cleanEnv({ FOO: 80 }, spec)
  expect(with80Num).toEqual({ FOO: 80 })
  const with65535 = cleanEnv({ FOO: '65535' }, spec)
  expect(with65535).toEqual({ FOO: 65535 })

  expect(() => cleanEnv({ FOO: '' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: '0' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: '65536' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: '042' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: '42.0' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: '42.42' }, spec, makeSilent)).toThrow()
  expect(() => cleanEnv({ FOO: 'hello' }, spec, makeSilent)).toThrow()
})

test('json()', () => {
  const env = cleanEnv({ FOO: '{"x": 123}' }, { FOO: json() })
  expect(env).toEqual({ FOO: { x: 123 } })

  expect(() => cleanEnv({ FOO: 'abc' }, { FOO: json() }, makeSilent)).toThrow()

  // default value should be passed through without running through JSON.parse()
  expect(
    cleanEnv(
      {},
      {
        FOO: json({ default: { x: 999 } }),
      },
    ),
  ).toEqual({ FOO: { x: 999 } })
})

test('url()', () => {
  assertPassthrough({ FOO: 'http://foo.com' }, { FOO: url() })
  assertPassthrough({ FOO: 'http://foo.com/bar/baz' }, { FOO: url() })
  assertPassthrough({ FOO: 'custom://foo.com/bar/baz?hi=1' }, { FOO: url() })

  expect(() => cleanEnv({ FOO: 'abc' }, { FOO: url() }, makeSilent)).toThrow()
})

test('str()', () => {
  const withEmpty = cleanEnv({ FOO: '' }, { FOO: str() })
  expect(withEmpty).toEqual({ FOO: '' })

  expect(() => cleanEnv({ FOO: 42 }, { FOO: str() }, makeSilent)).toThrow()
})

test('custom types', () => {
  const alwaysFoo = makeValidator((_x) => 'foo')

  const fooEnv = cleanEnv({ FOO: 'asdf' }, { FOO: alwaysFoo() })
  expect(fooEnv).toEqual({ FOO: 'foo' })

  const hex10 = makeValidator((x) => {
    if (/^[a-f0-9]{10}$/.test(x)) return x
    throw new Error('need 10 hex chars')
  })
  assertPassthrough({ FOO: 'a0d9aacbde' }, { FOO: hex10() })
  expect(() => cleanEnv({ FOO: 'abc' }, { FOO: hex10() }, makeSilent)).toThrow(Error)

  // Default values work with custom validators as well
  const withDefault = cleanEnv({}, { FOO: hex10({ default: 'abcabcabc0' }) })
  expect(withDefault).toEqual({ FOO: 'abcabcabc0' })
})
