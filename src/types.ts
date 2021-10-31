// Hacky conditional type to prevent default/devDefault from narrowing type T to a single value.
// Ideally this could be replaced by something that would enforce the default value being a subset
// of T, without affecting the definition of T itself
type DefaultType<T> =
  T extends string ? string :
  T extends number ? number :
  T extends boolean ? boolean :
  T extends object ? object :
  any

export interface Spec<T> {
  /**
   * An Array that lists the admissable parsed values for the env var.
   */
  choices?: ReadonlyArray<T>
  /**
   * A fallback value, which will be used if the env var wasn't specified. Providing a default effectively makes the env var optional.
   */
  default?: DefaultType<T>
  /**
   * A fallback value to use only when NODE_ENV is not 'production'.
   * This is handy for env vars that are required for production environments, but optional for development and testing.
   */
  devDefault?: DefaultType<T>
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
  _parse: (input: string) => T
}

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
