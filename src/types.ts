export interface Spec<T> {
  /**
   * An Array that lists the admissable parsed values for the env var.
   */
  choices?: ReadonlyArray<T>
  /**
   * A fallback value, which will be used if the env var wasn't specified. Providing a default effectively makes the env var optional.
   */
  default?: T
  /**
   * A fallback value to use only when NODE_ENV is not 'production'.
   * This is handy for env vars that are required for production environments, but optional for development and testing.
   */
  devDefault?: T
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
}

export interface ValidatorSpec<T> extends Spec<T> {
  type: string
  _parse: (input: string) => T
}

export interface CleanEnv {
  /** true if NODE_ENV === 'development' */
  readonly isDevelopment: boolean
  readonly isDev: boolean

  /** true if NODE_ENV === 'test' */
  readonly isTest: boolean

  /** true if NODE_ENV === 'production' */
  readonly isProduction: boolean
  readonly isProd: boolean
}

interface ReporterOptions {
  errors: { [key: string]: Error }
  env: unknown
}

export interface CleanOptions {
  /**
   * If true, accessing a property on cleanEnv not specified in the validators will throw an error
   * @default false
   */
  strict?: boolean

  /**
   * Pass in a function to override the default error handling and console output.
   * See ./reporter.js for the default implementation.
   */
  reporter?: ((opts: ReporterOptions) => void) | null
}

/**
 * Create your own validator functions.
 */
// export function makeValidator<T>(
//   parser: (input: string) => T,
//   type?: string,
// ): (spec?: Spec<T>) => ValidatorSpec<T>

/**
 * Parses env var string "0", "1", "true", "false", "t", "f" into Boolean.
 */
// export function bool<T extends boolean = boolean>(spec?: Spec<T>): ValidatorSpec<T>
// /**
//  * Parses an env var (eg. "42", "0.23", "1e5") into a Number.
//  */
// export function num<T extends number = number>(spec?: Spec<T>): ValidatorSpec<T>
// /**
//  * Passes string values through, will ensure an value is present unless a default value is given.
//  */
// export function str<T extends string = string>(spec?: Spec<T>): ValidatorSpec<T>
// /**
//  * Parses an env var with JSON.parse.
//  */
// export function json<T = any>(spec?: Spec<T>): ValidatorSpec<T>
// /**
//  * Ensures an env var is a url with a protocol and hostname
//  */
// export function url<T extends string = string>(spec?: Spec<T>): ValidatorSpec<T>
// /**
//  * Ensures an env var is an email address
//  */
// export function email<T extends string = string>(spec?: Spec<T>): ValidatorSpec<T>
// /**
//  * Ensures an env var is either a domain name or an ip address (v4 or v6)
//  */
// export function host<T extends string = string>(spec?: Spec<T>): ValidatorSpec<T>
// /**
//  * Ensures an env var is a TCP port (1-65535)
//  */
// export function port<T extends number = number>(spec?: Spec<T>): ValidatorSpec<T>
