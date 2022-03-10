![Build status](https://github.com/af/envalid/workflows/continuous-integration/badge.svg)

# Envalid

Envalid is a small library for validating and accessing environment variables in
Node.js (v8.12 or later) programs, aiming to:

* ensure that your program only runs when all of its environment dependencies are met
* give you executable documentation about the environment your program expects to run in
* give you an immutable API for your environment variables, so they don't change
  from under you while the program is running

## Changes in v7.x

Version 7 is a major update, with several breaking changes. Please review the breaking changes
below before upgrading:

* Rewritten in TypeScript
* Removed _all_ runtime dependencies except for [tslib](https://github.com/Microsoft/tslib)
* The mode-currently-known-as-`strict` is removed, and its behavior is enabled by default. This means:
  * The env object will *only* contain the env vars that were specified by your `validators`.
  * Any attempt to access an invalid/missing property on the env object will cause a thrown error.
  * Any attempt to mutate the cleaned env object will cause a thrown error.
  You can still opt-out of strict mode by disabling the `strictProxyMiddleware`, but it's not
  recommended (see "Custom Middleware", below).
* The `dotenv` package is no longer shipped as part of this library. You can easily use it directly
  by installing it and running `require('dotenv').config()` before you invoke envalid's `cleanEnv()`
* The `transformer` validator option is gone, replaced by the ability to add custom middleware
* The `host` and `ip` validators are now slightly less exhaustive. If you need these to be airtight, use
  your own custom validator instead
* When you try to access an invalid property on the cleaned env object, the error will no longer
  suggest an env variable that you may have intended. You can re-implement the old behavior with a custom
  middleware if you wish
* `NODE_ENV` support is now less opinionated, and an error is no longer thrown if a value other
  than `production`/`development`/`test` is passed in. You can provide your own validator for `NODE_ENV`
  to get exactly the behavior you want. The `isDev`, `isProduction`, etc properties still work as
  before, and are implemented as middleware so you can override their behavior as needed.
* `devDefault` values are no longer used if `NODE_ENV` was not set in the environment (a case where
  Envalid otherwise assumes `'production'` mode). Fixes #65

## API

### `envalid.cleanEnv(environment, validators, options)`

`cleanEnv()` returns a sanitized, immutable environment object, and accepts three
positional arguments:

* `environment` - An object containing your env vars (eg. `process.env`)
* `validators` - An object that specifies the format of required vars.
* `options` - An (optional) object, which supports the following key:
  * `reporter` - Pass in a function to override the default error handling and
                 console output. See `src/reporter.ts` for the default implementation.

By default, `cleanEnv()` will log an error message and exit (in Node) or throw (in browser) if any required
env vars are missing or invalid. You can override this behavior by writing your own reporter.

```js
import { cleanEnv, str, email, json } from 'envalid'

const env = cleanEnv(process.env, {
  API_KEY:            str(),
  ADMIN_EMAIL:        email({ default: 'admin@example.com' }),
  EMAIL_CONFIG_JSON:  json({ desc: 'Additional email parameters' }),
  NODE_ENV:           str({ choices: ['development', 'test', 'production', 'staging']}),
})


// Read an environment variable, which is validated and cleaned during
// and/or filtering that you specified with cleanEnv().
env.ADMIN_EMAIL     // -> 'admin@example.com'

// Envalid checks for NODE_ENV automatically, and provides the following
// shortcut (boolean) properties for checking its value:
env.isProduction    // true if NODE_ENV === 'production'
env.isTest          // true if NODE_ENV === 'test'
env.isDev           // true if NODE_ENV === 'development'
```

For an example you can play with, clone this repo and see the `example/` directory.

```
git clone https://github.com/af/envalid
cd envalid
yarn prepare
node example/server.js
```

## Validator types

Node's `process.env` only stores strings, but sometimes you want to retrieve other types
(booleans, numbers), or validate that an env var is in a specific format (JSON,
url, email address). To these ends, the following validation functions are available:

* `str()` - Passes string values through, will ensure an value is present unless a
          `default` value is given. Note that an empty string is considered a valid value -
          if this is undesirable you can easily create your own validator (see below)
* `bool()` - Parses env var strings `"1", "0", "true", "false", "t", "f"` into booleans
* `num()` - Parses an env var (eg. `"42", "0.23", "1e5"`) into a Number
* `email()` - Ensures an env var is an email address
* `host()` - Ensures an env var is either a domain name or an ip address (v4 or v6)
* `port()` - Ensures an env var is a TCP port (1-65535)
* `url()` - Ensures an env var is a url with a protocol and hostname
* `json()` - Parses an env var with `JSON.parse`

Each validation function accepts an (optional) object with the following attributes:

* `choices` - An Array that lists the admissable parsed values for the env var.
* `default` - A fallback value, which will be present in the output if the env var wasn't specified.
              Providing a default effectively makes the env var optional. Note that `default`
              values are not passed through validation logic, they are default *output* values.
* `devDefault` - A fallback value to use *only* when `NODE_ENV` is explicitly set and _not_ `'production'`.
                 This is handy for env vars that are required for production environments, but optional
                 for development and testing.
* `desc` - A string that describes the env var.
* `example` - An example value for the env var.
* `docs` - A url that leads to more detailed documentation about the env var.


## Custom validators

You can easily create your own validator functions with `envalid.makeValidator()`. It takes
a function as its only parameter, and should either return a cleaned value, or throw if the
input is unacceptable:

```js
import { makeValidator, cleanEnv } from 'envalid'
const twochars = makeValidator(x => {
    if (/^[A-Za-z]{2}$/.test(x)) return x.toUpperCase()
    else throw new Error('Expected two letters')
})

const env = cleanEnv(process.env, {
    INITIALS: twochars()
});
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
        for (const [envVar, err] of Object.entries(errors)) {
            if (err instanceof envalid.EnvError) {
                ...
            } else if (err instanceof envalid.EnvMissingError) {
                ...
            } else {
                ...
            }
        }
    }
})
```


## Custom Middleware (advanced)

In addition to `cleanEnv()`, as of v7 there is a new `customCleanEnv()` function,
which allows you to completely replace the processing that Envalid applies after applying
validations. You can use this custom escape hatch to transform the output however you wish.

### `envalid.customCleanEnv(environment, validators, applyMiddleware, options)`

`customCleanEnv()` uses the same API as `cleanEnv()`, but with an additional `applyMiddleware`
argument required in the third position:

* `applyMiddleware` - A functions that can modify the env object after it's
                      validated and cleaned. Envalid ships (and exports) its own default
                      middleware (see src/middleware.ts), which you can mix and match with your own
                      custom logic to get the behavior you desire.


## Utils

### testOnly

A helper function called `testOnly` is available, in case you need an default env var value only when
`NODE_ENV=test`. It should be used along with `devDefault`, for example:

```js
const env = cleanEnv(process.env, {
  SOME_VAR: envalid.str({devDefault: testOnly('myTestValue')})
})
```

For more context see [this issue](https://github.com/af/envalid/issues/32).

## FAQ

### Can I call `structuredClone()` on envalid's validated output?

Since by default envalid's output is wrapped in a Proxy, structuredClone [will not work](https://bugzilla.mozilla.org/show_bug.cgi?id=1269327#c1) on it. See [https://github.com/af/envalid/issues/177](#177)


## Related projects

* [dotenv](https://www.npmjs.com/package/dotenv) is a very handy tool for loading env vars from
  `.env` files. It was previously used as a dependency of Envalid's. To use them together, simply
  call `require('dotenv').config()` before you pass `process.env` to your `envalid.cleanEnv()`.

* [react-native-config](https://www.npmjs.com/package/react-native-config) can be useful for React Native projects for reading env vars from a `.env` file

* [fastify-envalid](https://github.com/alemagio/fastify-envalid) is a wrapper for using Envalid within [Fastify](https://www.fastify.io/)

* [nestjs-envalid](https://github.com/cobraz/nestjs-envalid) is a wrapper for using Envalid with [NestJS](https://nestjs.com/)


## Motivation

http://www.12factor.net/config
