import { test, expect } from 'vitest'
import { cleanEnv, makeValidator, str, num, email, url, json } from '../src'

const silent = { reporter: null }
const thrownMessage = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
  throw new Error('expected to throw')
}

test('no mask -> existing behavior (raw value still appears)', () => {
  const secret = 'not-an-email'
  const msg = thrownMessage(() => cleanEnv({ FOO: secret }, { FOO: email() }, silent))
  expect(msg).toContain(secret)
})

test("mask:'last4' hides the value but keeps the tail", () => {
  const secret = 'sk-live-0123456789wxyz'
  const msg = thrownMessage(() =>
    cleanEnv({ FOO: secret }, { FOO: email({ mask: 'last4' }) }, silent),
  )
  expect(msg).not.toContain(secret)
  expect(msg).toContain('****wxyz')
})

test("mask:'last4' short value fully masked", () => {
  const msg = thrownMessage(() =>
    cleanEnv({ FOO: 'abc' }, { FOO: email({ mask: 'last4' }) }, silent),
  )
  expect(msg).toContain('****')
  expect(msg).not.toContain('abc')
})

test("mask:'all' fully redacts", () => {
  const secret = 'super-secret-token'
  const msg = thrownMessage(() =>
    cleanEnv({ FOO: secret }, { FOO: email({ mask: 'all' }) }, silent),
  )
  expect(msg).not.toContain(secret)
  expect(msg).toContain('****')
})

test('custom mask function', () => {
  const secret = 'abcd1234'
  const msg = thrownMessage(() =>
    cleanEnv(
      { FOO: secret },
      { FOO: email({ mask: (v) => `<${String(v).length} chars>` }) },
      silent,
    ),
  )
  expect(msg).not.toContain(secret)
  expect(msg).toContain('<8 chars>')
})

test('works for custom validators and built-ins', () => {
  const upper = makeValidator<string>((x) => {
    if (x === x.toUpperCase()) return x
    throw new Error(`not upper: "${x}"`)
  })
  const secret = 'mixedCaseSecret'
  const msg = thrownMessage(() =>
    cleanEnv({ FOO: secret }, { FOO: upper({ mask: 'last4' }) }, silent),
  )
  expect(msg).not.toContain(secret)
  expect(msg).toContain('****cret')

  const numMsg = thrownMessage(() =>
    cleanEnv({ FOO: 'not-a-number' }, { FOO: num({ mask: 'all' }) }, silent),
  )
  expect(numMsg).not.toContain('not-a-number')
})

test('choices error masks the offending value', () => {
  const secret = 'secret-choice'
  const msg = thrownMessage(() =>
    cleanEnv({ FOO: secret }, { FOO: str({ choices: ['a', 'b'], mask: 'last4' }) }, silent),
  )
  expect(msg).not.toContain(secret)
  expect(msg).toContain('****oice')
})

test('redacts thrown strings too', () => {
  const thrower = makeValidator<string>((x) => {
    throw `bad value: "${x}"`
  })
  const secret = 'string-thrown-secret'
  const msg = thrownMessage(() =>
    cleanEnv({ FOO: secret }, { FOO: thrower({ mask: 'all' }) }, silent),
  )
  expect(msg).not.toContain(secret)
})

test('short values cannot corrupt surrounding text', () => {
  // "a" previously replaced every "a" in the message ("Inv****lid ...")
  const msg = thrownMessage(() => cleanEnv({ FOO: 'a' }, { FOO: num({ mask: 'all' }) }, silent))
  expect(msg).toBe('Invalid number input: "****"')
})

test('json/url show a masked value only when a mask is set', () => {
  const secret = 'nope-secret-json'
  const masked = thrownMessage(() =>
    cleanEnv({ FOO: secret }, { FOO: json({ mask: 'last4' }) }, silent),
  )
  expect(masked).not.toContain(secret)
  expect(masked).toBe('Invalid json: "****json"')

  // default stays value-free (unchanged by this feature)
  expect(thrownMessage(() => cleanEnv({ FOO: secret }, { FOO: json() }, silent))).toBe(
    'Invalid json',
  )

  const u = thrownMessage(() =>
    cleanEnv({ FOO: 'not a url' }, { FOO: url({ mask: 'all' }) }, silent),
  )
  expect(u).toBe('Invalid url: "****"')
})

test('unknown preset fails safe (full redaction)', () => {
  const secret = 'oops-typo-preset'
  const msg = thrownMessage(() =>
    // biome-ignore lint/suspicious/noExplicitAny: simulating untyped JS caller
    cleanEnv({ FOO: secret }, { FOO: email({ mask: 'last4x' as any }) }, silent),
  )
  expect(msg).not.toContain(secret)
})

test('example in missing-var error is masked', () => {
  const msg = thrownMessage(() =>
    cleanEnv(
      {},
      { FOO: str({ example: 'sk-example-secret-1234', mask: 'last4' }) },
      silent,
    ),
  )
  expect(msg).not.toContain('sk-example-secret-1234')
  expect(msg).toContain('****1234')
})

test('defensive paths: empty input and non-Error, non-string throws', () => {
  // empty input skips redaction entirely (must not split char-by-char)
  const empty = makeValidator<string>(() => {
    throw new Error('bad ""')
  })
  expect(() => empty({ mask: 'all' })._parse('')).toThrow('bad ""')

  // a thrown non-Error/non-string passes through untouched
  const weird = makeValidator<string>(() => {
    throw { weird: true }
  })
  let caught: unknown
  try {
    cleanEnv({ FOO: 'x' }, { FOO: weird({ mask: 'all' }) }, silent)
  } catch (e) {
    caught = e
  }
  expect(caught).toEqual({ weird: true })
})
