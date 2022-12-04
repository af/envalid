import {
  cleanEnv,
  str,
  bool,
  num,
  RequiredValidatorSpec,
  OptionalValidatorSpec,
  json,
} from '../src'
import { expectTypeOf } from 'expect-type'
import { makeStructuredValidator, makeValidator } from '../src/makers'

describe('validators types', () => {
  test('boolean validator', () => {
    const validator = bool
    expectTypeOf(validator()).toEqualTypeOf<RequiredValidatorSpec<boolean>>()
    expectTypeOf(
      validator({
        default: false,
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<boolean>>()
    expectTypeOf(
      validator({
        choices: [true, false],
        default: true,
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<boolean>>()
    expectTypeOf(validator({ default: undefined })).toEqualTypeOf<OptionalValidatorSpec<boolean>>()
    expectTypeOf(validator({ devDefault: undefined })).toEqualTypeOf<
      RequiredValidatorSpec<boolean>
    >()
    expectTypeOf(validator({ devDefault: false })).toEqualTypeOf<RequiredValidatorSpec<boolean>>()
  })

  test('number-based validators', () => {
    const validator = makeValidator<number>(() => 1)
    // Specifying default or devDefault value should cause validator spec type param to widen
    expectTypeOf(
      validator({
        default: 0,
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<number>>()
    expectTypeOf(
      validator({
        devDefault: 0,
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<number>>()
    // But this inference can be overridden by specifying a type parameter
    expectTypeOf(
      validator<0>({
        default: 0,
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<0>>()
    expectTypeOf(
      validator<0>({
        devDefault: 0,
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<0>>()

    // Choices
    expectTypeOf(
      validator({
        choices: [1, 2],
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<1 | 2>>()
    expectTypeOf(
      validator({
        choices: [1, 2],
        default: 1,
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<1 | 2>>()

    // @ts-expect-error - 3 is not assignable to 1 | 2
    validator({ choices: [1, 2], default: 3 })
    // @ts-expect-error - 3 is not assignable to 1 | 2
    validator({ choices: [1, 2], devDefault: 3 })
    // Basic
    expectTypeOf(validator()).toEqualTypeOf<RequiredValidatorSpec<number>>()
    expectTypeOf(validator<1>()).toEqualTypeOf<RequiredValidatorSpec<1>>()
    expectTypeOf(validator({ default: undefined })).toEqualTypeOf<OptionalValidatorSpec<number>>()
    expectTypeOf(validator({ default: undefined, desc: '' })).toEqualTypeOf<
      OptionalValidatorSpec<number>
    >()
    expectTypeOf(validator({ default: undefined, devDefault: undefined })).toEqualTypeOf<
      OptionalValidatorSpec<number>
    >()
    expectTypeOf(validator({ devDefault: undefined })).toEqualTypeOf<
      RequiredValidatorSpec<number>
    >()
    expectTypeOf(validator<2>({ devDefault: 2 })).toEqualTypeOf<RequiredValidatorSpec<2>>()
  })
  test('string-based validators', () => {
    const validator = makeValidator<string>(() => '')
    // Specifying default or devDefault value should cause validator spec type param to widen
    expectTypeOf(
      validator({
        default: 'foo',
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<string>>()
    expectTypeOf(
      validator({
        devDefault: 'foo',
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<string>>()
    // But this inference can be overridden by specifying a type parameter
    expectTypeOf(
      validator<'foo'>({
        default: 'foo',
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<'foo'>>()
    expectTypeOf(
      validator<'foo'>({
        devDefault: 'foo',
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<'foo'>>()
    expectTypeOf(
      validator({
        choices: ['foo', 'bar'],
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<'foo' | 'bar'>>()
    expectTypeOf(
      validator({
        choices: ['foo', 'bar'],
        default: 'foo',
      }),
    ).toEqualTypeOf<RequiredValidatorSpec<'foo' | 'bar'>>()
    //@ts-expect-error - baz is not assignable to 'foo' | 'bar'
    validator({ choices: ['foo', 'bar'], default: 'baz' })
    // Basic
    expectTypeOf(validator()).toEqualTypeOf<RequiredValidatorSpec<string>>()
    expectTypeOf(validator<'foo'>()).toEqualTypeOf<RequiredValidatorSpec<'foo'>>()
    expectTypeOf(validator({ default: undefined })).toEqualTypeOf<OptionalValidatorSpec<string>>()
    expectTypeOf(validator({ devDefault: undefined })).toEqualTypeOf<
      RequiredValidatorSpec<string>
    >()
    expectTypeOf(validator({ default: undefined, desc: '' })).toEqualTypeOf<
      OptionalValidatorSpec<string>
    >()
    expectTypeOf(validator({ default: undefined, devDefault: undefined })).toEqualTypeOf<
      OptionalValidatorSpec<string>
    >()
    expectTypeOf(validator({ default: undefined })).toEqualTypeOf<OptionalValidatorSpec<string>>()
    expectTypeOf(validator({ devDefault: undefined })).toEqualTypeOf<
      RequiredValidatorSpec<string>
    >()

    expectTypeOf(validator({ devDefault: 'foo' })).toEqualTypeOf<RequiredValidatorSpec<string>>()
    expectTypeOf(validator<'foo'>({ devDefault: 'foo' })).toEqualTypeOf<
      RequiredValidatorSpec<'foo'>
    >()
    expectTypeOf(validator({ default: 'foo', devDefault: 'foo' })).toEqualTypeOf<
      RequiredValidatorSpec<string>
    >()
    expectTypeOf(validator<'foo' | 'bar'>({ default: 'foo', devDefault: 'bar' })).toEqualTypeOf<
      RequiredValidatorSpec<'foo' | 'bar'>
    >()
    expectTypeOf(
      validator<'foo' | 'bar'>({ choices: ['foo', 'bar'], devDefault: 'bar' }),
    ).toEqualTypeOf<RequiredValidatorSpec<'foo' | 'bar'>>()
  })
  test('structured data validator', () => {
    const validator = makeStructuredValidator(() => ({}))
    expectTypeOf(validator()).toEqualTypeOf<RequiredValidatorSpec<any>>()
    expectTypeOf(validator({ default: {} as any })).toEqualTypeOf<RequiredValidatorSpec<any>>()
    expectTypeOf(validator({ default: undefined })).toEqualTypeOf<OptionalValidatorSpec<any>>()
    expectTypeOf(validator({ default: undefined, desc: '' })).toEqualTypeOf<
      OptionalValidatorSpec<any>
    >()
    expectTypeOf(validator({ default: undefined, devDefault: undefined })).toEqualTypeOf<
      OptionalValidatorSpec<any>
    >()
    //@ts-expect-error - Choices not available for structured data
    validator({ choices: [{ foo: 'bar' }] })
    expectTypeOf(validator({ devDefault: undefined })).toEqualTypeOf<RequiredValidatorSpec<any>>()
    expectTypeOf(validator({ devDefault: { foo: 'bar' } })).toEqualTypeOf<
      RequiredValidatorSpec<{ foo: string }>
    >()
    expectTypeOf(validator<{ foo: 'bar' }>()).toEqualTypeOf<RequiredValidatorSpec<{ foo: 'bar' }>>()
    expectTypeOf(
      validator({
        default: {
          hello: 'world',
        },
      }),
    ).toEqualTypeOf<
      RequiredValidatorSpec<{
        hello: string
      }>
    >()
    expectTypeOf(
      validator<{ hello: 'world' }>({
        default: {
          hello: 'world',
        },
      }),
    ).toEqualTypeOf<
      RequiredValidatorSpec<{
        hello: 'world'
      }>
    >()
    expectTypeOf(validator<{ hello: string }>()).toEqualTypeOf<
      RequiredValidatorSpec<{
        hello: string
      }>
    >()
  })
})

test('cleanEnv', () => {
  const env = {
    STR: 'FOO',
    STR_OPT: undefined,
    STR_CHOICES: 'foo',
    STR_REQ: 'BAR',
    STR_DEFAULT_CHOICES: 'bar',
    BOOL: 'false',
    BOOL_OPT: undefined,
    BOOL_DEFAULT: undefined,
    NUM: '34',
    NUM_DEFAULT_CHOICES: '3',
    JSON_ANY: JSON.stringify(true),
    JSON_REQ_ANY: JSON.stringify('Foo bar'),
    JSON_DEV_DEFAULT: JSON.stringify('Foo bar'),
    JSON_DEFAULT: JSON.stringify({ foo: 'bar' }),
    JSON_DEFAULT_OPT: undefined,
  }
  const specs = {
    STR: str(),
    STR_OPT: str({ default: undefined }),
    STR_CHOICES: str({ choices: ['foo', 'bar'] }),
    STR_REQ: str({ default: 'foo' }),
    STR_DEFAULT_CHOICES: str({ default: 'foo', choices: ['foo', 'bar'] }),
    BOOL: bool(),
    BOOL_OPT: bool({ default: undefined }),
    BOOL_DEFAULT: bool({
      default: false,
    }),
    NUM: num(),
    NUM_DEFAULT_CHOICES: num({ default: 1, choices: [1, 2, 3] }),
    JSON_ANY: json(),
    JSON_REQ_ANY: json({ default: {} as any }),
    JSON_DEFAULT: json({ default: { foo: 'bar' } }),
    JSON_DEV_DEFAULT: json({ devDefault: { foo: 'bar' } }),
    JSON_DEFAULT_OPT: json<{ foo: 'bar' }>({ default: undefined }),
  }
  interface TestedCleanedEnv {
    readonly STR: string
    readonly STR_OPT?: string
    readonly STR_CHOICES: 'foo' | 'bar'
    readonly STR_REQ: string
    readonly STR_DEFAULT_CHOICES: 'foo' | 'bar'
    readonly BOOL: boolean
    readonly BOOL_OPT?: boolean
    readonly BOOL_DEFAULT: boolean
    readonly NUM: number
    readonly NUM_DEFAULT_CHOICES: 1 | 2 | 3
    readonly JSON_ANY: any
    readonly JSON_REQ_ANY: any
    readonly JSON_DEFAULT: { foo: string }
    readonly JSON_DEV_DEFAULT: { foo: string }
    readonly JSON_DEFAULT_OPT?: { foo: string }
  }

  expectTypeOf(cleanEnv(env, specs)).toMatchTypeOf<TestedCleanedEnv>()

  // Should also work when specs inlined
  expectTypeOf(
    cleanEnv(env, {
      STR: str(),
      STR_OPT: str({ default: undefined }),
      STR_CHOICES: str({ choices: ['foo', 'bar'] }),
      STR_REQ: str({ default: 'foo' }),
      STR_DEFAULT_CHOICES: str({ default: 'foo', choices: ['foo', 'bar'] }),
      BOOL: bool(),
      BOOL_OPT: bool({ default: undefined }),
      BOOL_DEFAULT: bool({
        default: false,
      }),
      NUM: num(),
      NUM_DEFAULT_CHOICES: num({ default: 1, choices: [1, 2, 3] }),
      JSON_ANY: json(),
      JSON_REQ_ANY: json({ default: {} as any }),
      JSON_DEFAULT: json({ default: { foo: 'bar' } }),
      JSON_DEV_DEFAULT: json({ devDefault: { foo: 'bar' } }),
      JSON_DEFAULT_OPT: json<{ foo: 'bar' }>({ default: undefined }),
    }),
  ).toMatchTypeOf<TestedCleanedEnv>()
})
