interface Spec<T> {
    choices?: string[];
    default?: T;
    devDefault?: T;
    desc?: string;
}

interface ValidatorSpec<T> extends Spec<T> {
    type: string;
    _parse: (input: string) => T;
}

interface Specs {
    [key: string]: ValidatorSpec<any>;
}

interface CleanEnv {
    /** true if NODE_ENV === 'development' */
    isDev: boolean;

    /** true if NODE_ENV === 'test' */
    isTest: boolean;

    /** true if NODE_ENV === 'production' */
    isProduction: boolean;
}

interface CleanOptions {
    /**
     * If true, the output of cleanEnv will only contain the env vars that were specified in the validators argument.
     * @default false
     */
    strict?: boolean;

    /**
     * Pass in a function to override the default error handling and console output.
     * See lib/reporter.js for the default implementation.
     */
    reporter?: (errors: { [key: string]: Error }, env: any) => void;

    /**
     * A function used to transform the cleaned environment object before it is returned from cleanEnv.
     */
    transformer?: (env: any) => any;

    /**
     * Path to the file that is parsed by dotenv to optionally load more env vars at runtime.
     * Pass null if you want to skip dotenv processing entirely and only load from process.env.
     * @default ".env"
     */
    dotEnvPath?: string;
}

/**
 * Returns a sanitized, immutable environment object.
 * @param environment An object containing your env vars (eg. process.env).
 * @param validators An object that specifies the format of required vars.
 */
export function cleanEnv(environment: any, validators?: Specs, options?: CleanOptions);
/**
 * Returns a sanitized, immutable environment object.
 * @param environment An object containing your env vars (eg. process.env).
 * @param validators An object that specifies the format of required vars.
 */
export function cleanEnv<T>(environment: any, validators?: Specs, options?: CleanOptions): T & CleanEnv;

/**
 * Create your own validator functions.
 */
export function makeValidator<T>(parser: (input: string) => any, type?: string): (spec?: Spec<T>) => ValidatorSpec<T>;

/**
 * Parses env var string "0", "1", "true", "false", "t", "f" into Boolean.
 */
export function bool(spec?: Spec<boolean>): ValidatorSpec<boolean>;
/**
 * Parses an env var (eg. "42", "0.23", "1e5") into a Number.
 */
export function num(spec?: Spec<number>): ValidatorSpec<number>;
/**
 * Passes string values through, will ensure an value is present unless a default value is given.
 */
export function str(spec?: Spec<string>): ValidatorSpec<string>;
/**
 * Parses an env var with JSON.parse.
 */
export function json(spec?: Spec<any>): ValidatorSpec<any>;
/**
 * Ensures an env var is a url with a protocol and hostname
 */
export function url(spec?: Spec<string>): ValidatorSpec<string>;
/**
 * Ensures an env var is an email address
 */
export function email(spec?: Spec<string>): ValidatorSpec<string>;