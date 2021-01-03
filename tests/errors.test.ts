import { EnvError, EnvMissingError } from '../src'

test('EnvError', () => {
  const e = new EnvError('baz')
  expect(e instanceof EnvError).toBe(true)
  expect(e instanceof TypeError).toBe(true)
  expect(e.name).toBe('EnvError')
})

test('EnvMissingError', () => {
  const e = new EnvMissingError('baz')
  expect(e instanceof EnvMissingError).toBe(true)
  expect(e instanceof ReferenceError).toBe(true)
  expect(e.name).toBe('EnvMissingError')
})
