[![Build Status](https://travis-ci.org/af/envalid.svg?branch=master)](https://travis-ci.org/af/envalid)

# Envalid

Envalid is a small library for validating and accessing environment variables in
Node.js (v8.12 or later) programs, aiming to:

* ensure that your program only runs when all of its environment dependencies are met
* give you executable documentation about the environment your program expects to run in
* give you an immutable API for your environment variables, so they don't change
  from under you while the program is running


## API

### `envalid.cleanEnv(environment, validators, options)`

`cleanEnv()` returns a sanitized, immutable environment object, and accepts three
positional arguments:

* `environment` - An object containing your env vars (eg. `process.env`)
* `validators` - An object that specifies the format of required vars.
* `options` - An (optional) object, which supports the following keys:
    * `strict` - (default: `false`) Enable more rigorous behavior. See "Strict Mode" below
    * `reporter` - Pass in a function to override the default error handling and
                   console output. See `src/reporter.js` for the default implementation.
    * `transformer` - A function used to transform the cleaned environment object
                      before it is returned from `cleanEnv`
    * `dotEnvPath` - (default: `'.env'`) Path to the file that is parsed by
                     [dotenv](https://github.com/motdotla/dotenv) to
                     optionally load more env vars at runtime. Pass `null` if you want
                     to skip `dotenv` processing entirely and only load from `process.env`.

By default, `cleanEnv()` will log an error message and exit if any required
env vars are missing or invalid.

```js
const envalid = require('envalid')
const { str, email, json } = envalid

const env = envalid.cleanEnv(process.env, {
    API_KEY:            str(),
    ADMIN_EMAIL:        email({ default: 'admin@example.com' }),
    EMAIL_CONFIG_JSON:  json({ desc: 'Additional email parameters' })
})


// Read an environment variable, which is validated and cleaned during
// and/or filtering that you specified with cleanEnv().
env.ADMIN_EMAIL     // -> 'admin@example.com'

// Envalid parses NODE_ENV automatically, and provides the following
// shortcut (boolean) properties for checking its value:
env.isProduction    // true if NODE_ENV === 'production'
env.isTest          // true if NODE_ENV === 'test'
env.isDev           // true if NODE_ENV === 'development'
```

For an example you can play with, clone this repo and see the `example/` directory.


## Validator types

Node's `process.env` only stores strings, but sometimes you want to retrieve other types
(booleans, numbers), or validate that an env var is in a specific format (JSON,
url, email address). To these ends, the following validation functions are available:

* `str()` - Passes string values through, will ensure an value is present unless a
          `default` value is given. Note that an empty string is considered a valid value -
          if this is undesirable you can easily create your own validator (see below)
* `bool()` - Parses env var strings `"0", "1", "true", "false", "t", "f"` into booleans
* `num()` - Parses an env var (eg. `"42", "0.23", "1e5"`) into a Number
* `email()` - Ensures an env var is an email address
* `host()` - Ensures an env var is either a domain name or an ip address (v4 or v6)
* `port()` - Ensures an env var is a TCP port (1-65535)
* `url()` - Ensures an env var is a url with a protocol and hostname
* `json()` - Parses an env var with `JSON.parse`

Each validation function accepts an (optional) object with the following attributes:

* `choices` - An Array that lists the admissable parsed values for the env var.
* `default` - A fallback value, which will be used if the env var wasn't specified.
              Providing a default effectively makes the env var optional.
* `devDefault` - A fallback value to use *only* when `NODE_ENV` is _not_ `'production'`. This is handy
                 for env vars that are required for production environments, but optional
                 for development and testing.
* `desc` - A string that describes the env var.
* `example` - An example value for the env var.
* `docs` - A url that leads to more detailed documentation about the env var.


## Custom validators

You can easily create your own validator functions with `envalid.makeValidator()`. It takes
a function as its only parameter, and should either return a cleaned value, or throw if the
input is unacceptable:

```js
const { makeValidator, cleanEnv } = require('envalid')
const twochars = makeValidator(x => {
    if (/^[A-Za-z]{2}$/.test(x)) return x.toUpperCase()
    else throw new Error('Expected two letters')
})

const env = cleanEnv(process.env, {
    INITIALS: twochars()
});
```

You can, and should, also provide a `type` with your validator. This can be exposed by tools
to help other developers better understand you configuration options.

To add it, pass a string with the name as the second argument to `makeValidator`.

```js
const { makeValidator } = require('envalid')
const twochars = makeValidator(x => {
    if (/^[A-Za-z]{2}$/.test(x)) return x.toUpperCase()
    else throw new Error('Expected two letters')
}, 'twochars')
```


## Error Reporting

By default, if any required environment variables are missing or have invalid
values, envalid will log a message and call `process.exit(1)`. You can override
this behavior by passing in your own function as `options.reporter`. For example:

```js
const env = cleanEnv(process.env, myValidators, {
    reporter: ({ errors, env }) => {
        emailSiteAdmins('Invalid env vars: ' + Object.keys(errors))
    }
})
```

Additionally, envalid exposes `EnvError` and `EnvMissingError`, which can be checked in case specific error handling is desired:

```js
const env = cleanEnv(process.env, myValidators, {
    reporter: ({ errors, env }) => {
        errors.forEach(err => {
            if (err instanceof envalid.EnvError) {
                ...
            } else if (err instanceof envalid.EnvMissingError) {
                ...
            } else {
                ...
            }
        });
    }
})
```

## Strict mode

By passing the `{ strict: true }` option, envalid gives you extra tight guarantees
about the cleaned env object:

* The env object will *only* contain the env vars that were specified by your `validators`.
* Any attempt to access an invalid/missing property on the env object will cause a thrown error.
* Any attempt to mutate the cleaned env object will cause a thrown error.


## `.env` File Support

Envalid wraps the very handy [dotenv](https://www.npmjs.com/package/dotenv) package,
so if you have a `.env` file in your project, envalid will read and validate the
env vars from that file as well.

## Usage within React Native

When using Envalid within React Native the `dotenv` integration will not work, and the `dotEnvPath` option will be ignored.

Envalid can be used within React Native with a custom reporter.

Instead of `dotenv` [react-native-config](https://www.npmjs.com/package/react-native-config) can be used to read the configuration.

Example:

```js
const reactNativeConfig = require('react-native-config')
const rawConfig = reactNativeConfig.default

const validatedConfig = envalid.cleanEnv(
  rawConfig,
  {
    // validators
  },
  {
    dotEnvPath: null,
    reporter: ({ errors = {}, env = {} }) => {
      // handle errors
    },
  },
)
```

## Usage within browsers

When using Envalid within browsers the `dotenv` integration will not work, and the `dotEnvPath` option will be ignored.

## Utils

### testOnly

A helper function called `testOnly` is available, in case you need an default env var only when
`NODE_ENV=test`. It should be used along with `devDefault`, for example:

```js
const env = cleanEnv(process.env, {
  SOME_VAR: envalid.str({devDefault: testOnly('myTestValue')})
})
```

For more context see [this issue](https://github.com/af/envalid/issues/32).

## Motivation

http://www.12factor.net/config
