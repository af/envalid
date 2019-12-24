interface Spec<T> {
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

interface ValidatorSpec<T> extends Spec<T> {
    type: string
    _parse: (input: string) => T
}

interface CleanEnv {
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

interface CleanOptions {
    /**
     * If true, the output of cleanEnv will only contain the env vars that were specified in the validators argument.
     * @default false
     */
    strict?: boolean

    /**
     * Pass in a function to override the default error handling and console output.
     * See ./reporter.js for the default implementation.
     */
    reporter?: (opts: ReporterOptions) => void

    /**
     * A function used to transform the cleaned environment object before it is returned from cleanEnv.
     */
    transformer?: (env: unknown) => unknown

    /**
     * Path to the file that is parsed by dotenv to optionally load more env vars at runtime.
     * Pass null if you want to skip dotenv processing entirely and only load from process.env.
     * @default ".env"
     */
    dotEnvPath?: string | null
}

interface StrictCleanOptions extends CleanOptions {
    strict: true
}

/**
 * Returns a sanitized, immutable environment object. _Only_ the env vars
 * specified in the `validators` parameter will be accessible on the returned
 * object.
 * @param environment An object containing your env vars (eg. process.env).
 * @param validators An object that specifies the format of required vars.
 * @param options An object that specifies options for cleanEnv.
 */
export function cleanEnv<T>(
    environment: unknown,
    validators: { [K in keyof T]: ValidatorSpec<T[K]> },
    options: StrictCleanOptions
): Readonly<T> & CleanEnv
/**
 * Returns a sanitized, immutable environment object.
 * @param environment An object containing your env vars (eg. process.env).
 * @param validators An object that specifies the format of required vars.
 * @param options An object that specifies options for cleanEnv.
 */
export function cleanEnv<T>(
    environment: unknown,
    validators?: { [K in keyof T]: ValidatorSpec<T[K]> },
    options?: CleanOptions
): Readonly<T> & CleanEnv & { readonly [varName: string]: string | undefined }
// The preceding line is not a mistake! In a non-strict environment, the
// returned environment object can have properties other than the ones we've
// validated. these are not parsed or processed, and thus are always of type
// `string`. If you need better type safety and a fully-inferred environment,
// use `cleanEnv` in strict mode.

/**
 * Create your own validator functions.
 */
export function makeValidator<T>(
    parser: (input: string) => T,
    type?: string
): (spec?: Spec<T>) => ValidatorSpec<T>

/**
 * Parses env var string "0", "1", "true", "false", "t", "f" into Boolean.
 */
export function bool(spec?: Spec<boolean>): ValidatorSpec<boolean>
/**
 * Parses an env var (eg. "42", "0.23", "1e5") into a Number.
 */
export function num(spec?: Spec<number>): ValidatorSpec<number>
/**
 * Passes string values through, will ensure an value is present unless a default value is given.
 */
export function str(spec?: Spec<string>): ValidatorSpec<string>
/**
 * Parses an env var with JSON.parse.
 */
export function json(spec?: Spec<any>): ValidatorSpec<any>
/**
 * Ensures an env var is a url with a protocol and hostname
 */
export function url(spec?: Spec<string>): ValidatorSpec<string>
/**
 * Ensures an env var is an email address
 */
export function email(spec?: Spec<string>): ValidatorSpec<string>
/**
 * Ensures an env var is either a domain name or an ip address (v4 or v6)
 */
export function host(spec?: Spec<string>): ValidatorSpec<string>
/**
 * Ensures an env var is a TCP port (1-65535)
 */
export function port(spec?: Spec<number>): ValidatorSpec<number>

/**
 * Utility function for providing default values only when NODE_ENV=test
 */
export function testOnly(defaultValueForTests: any): any

declare class EnvError extends TypeError {
    constructor(...args: any[])
}

declare class EnvMissingError extends ReferenceError {
    constructor(...args: any[])
}
