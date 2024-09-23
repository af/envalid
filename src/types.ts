export interface Spec<T> {
  /**
   * An Array that lists the admissable parsed values for the env var.
   */
  choices?: ReadonlyArray<T>
  /**
   * A string that describes the env var.
   */
  desc?: string
  /**
   * An example value for the env var.
   */
  example?: string
  /**
   * A url that leads to more detailed documentation about the env var.
   */
  docs?: string
  /**
   * A fallback value, which will be used if the env var wasn't specified. Providing a default effectively makes the env var optional.
   */
  default?: NonNullable<T> | undefined
  /**
   * A fallback value to use only when NODE_ENV is not 'production'.
   * This is handy for env vars that are required for production environments, but optional for development and testing.
   */
  devDefault?: NonNullable<T> | undefined

  /**
   * A function (env -> boolean) that allows an env var to be required only when certain
   * conditions are met with the rest of the env object. Use With default: undefined.
   */
  requiredWhen?: (cleanedEnv: Record<string, unknown>) => boolean | undefined
}

type OptionalAttrs<T> =
  | { default: undefined }
  | { devDefault: undefined }
  | { default: undefined; devDefault: undefined }
  | { default: NonNullable<T>; devDefault: undefined }
  | { default: undefined; devDefault: NonNullable<T> }
type RequiredAttrs<T> =
  | { default: NonNullable<T> }
  | { devDefault: NonNullable<T> }
  | { devDefault: NonNullable<T>; default: NonNullable<T> }
  | {}

type DefaultKeys = 'default' | 'devDefault'

type OptionalSpec<T> = Spec<T> & OptionalAttrs<T>
type OptionalTypelessSpec = Omit<OptionalSpec<unknown>, 'choices'>

type RequiredSpec<T> = Spec<T> & RequiredAttrs<T>
type RequiredTypelessSpec = Omit<RequiredSpec<unknown>, 'choices' | DefaultKeys>

type ChoicelessOptionalSpec<T> = Omit<Spec<T>, 'choices' | DefaultKeys> & OptionalAttrs<T>
type ChoicelessRequiredSpec<T> = Omit<Spec<T>, 'choices' | DefaultKeys> & RequiredAttrs<T>

type WithParser<T> = {
  _parse: (input: string) => T
}

export type RequiredValidatorSpec<T> = RequiredSpec<T> & WithParser<T>

export type OptionalValidatorSpec<T> = OptionalSpec<T> & WithParser<T>

export type ValidatorSpec<T> = RequiredValidatorSpec<T> | OptionalValidatorSpec<T>

// Such validator works for exactly one type. You can't parametrize
// the output type at invocation site (e.g.: boolean).
export interface ExactValidator<T> {
  (spec: OptionalSpec<T>): OptionalValidatorSpec<T>
  (spec?: RequiredSpec<T>): RequiredValidatorSpec<T>
}

// Such validator only works for subtypes of BaseT.
export interface BaseValidator<BaseT> {
  // These function overloads enable nuanced type inferences for optimal DX
  // This will prevent specifying "default" alone from narrowing down output type.
  // https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads
  <T extends BaseT>(spec: OptionalSpec<T>): OptionalValidatorSpec<T>
  (spec: ChoicelessRequiredSpec<BaseT>): RequiredValidatorSpec<BaseT>
  <T extends BaseT>(spec?: RequiredSpec<T>): RequiredValidatorSpec<T>
}

// Such validator inputs a structured input format such as JSON.
// Because it can output complex types, including objects:
// - it has no supertype
// - it fallbacks to 'any' when no type information can be inferred
//   from the spec object.
// - One can't pass "choices" since choices uses reference equality.
export interface StructuredValidator {
  // Defaults to any when no argument (prevents 'unknown')
  (): RequiredValidatorSpec<any>
  // Allow overriding output type with type parameter
  <T>(): RequiredValidatorSpec<T>
  // Make sure we grab 'any' when no type inference can be made
  // otherwise it would resolve to 'unknown'
  (spec: RequiredTypelessSpec): RequiredValidatorSpec<any>
  (spec: OptionalTypelessSpec): OptionalValidatorSpec<any>
  <T>(spec: ChoicelessOptionalSpec<T>): OptionalValidatorSpec<T>
  <T>(spec: ChoicelessRequiredSpec<T>): RequiredValidatorSpec<T>
}

export type SpecsOutput<S> = {
  [K in keyof S]: unknown
}

export type CleanedEnv<S> =
  S extends Record<string, ValidatorSpec<unknown>>
  ? Readonly<
    {
      [K in keyof S]: S[K] extends OptionalValidatorSpec<infer U>
      ? U | undefined
      : S[K] extends RequiredValidatorSpec<infer U>
      ? U
      : never
    } & CleanedEnvAccessors
  >
  : never

export interface CleanedEnvAccessors {
  /** true if NODE_ENV === 'development' */
  readonly isDevelopment: boolean
  readonly isDev: boolean

  /** true if NODE_ENV === 'test' */
  readonly isTest: boolean

  /** true if NODE_ENV === 'production' */
  readonly isProduction: boolean
  readonly isProd: boolean
}

export interface ReporterOptions<T> {
  errors: Partial<Record<keyof T, Error>>
  env: unknown
}

export interface CleanOptions<T> {
  /**
   * Pass in a function to override the default error handling and console output.
   * See ./reporter.ts for the default implementation.
   */
  reporter?: ((opts: ReporterOptions<T>) => void) | null
}

export interface StrictProxyMiddlewareOptions {
  /**
   * A list of extra inspectable properties to add to the middleware.
   *
   * This is useful if you want to add support for framework-specific values.
   */
  extraInspectables?: string[]
}
