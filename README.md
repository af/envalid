[![Build Status](https://secure.travis-ci.org/af/envalid.png)](http://travis-ci.org/af/envalid)

# Envalid

Envalid is a small library for validating and accessing environment variables in
Node.js programs.

Envalid aims to:

* give you executable documentation about the environment your program is expected to run in
* help you treat env vars as a well-tested module, rather than a global grab bag of strings
* give you an immutable API for your environment variables, so they don't change
  from under you while the program is running

** Note: version 2.x of envalid only supports Node 6 and above, and the API is
completely rewritten from version 0.x - 1.x **


## API

```js
const { cleanEnv } = require('envalid')

// cleanEnv() accepts three positional arguments:
//      * an object containing your env vars (eg. process.env)
//      * an object literal that specifies the format of required vars.
//      * an object with options
// This will throw an exception if any required conditions are not met.
cleanEnv(process.env, {
    NODE_ENV: { choices: ['production', 'test', 'development'] },
    ADMIN_EMAIL: { test: /.+@mydomain\.com/ },
    EMAIL_CONFIG_JSON: { parse: JSON.parse, desc: 'Additional email parameters' }
}, { strict: true });

// Supported keys for env var specifications:
// desc - A string that describes the env var.
// choices - An Array that gives the admissable parsed values for the env var.
// test - A RegExp that the env var must match (or an exception will be thrown)
// parse - A function the env var will be passed through before being accessed
// default - A fallback value if the env var wasn't specified. This effectively
//           makes the env var optional.


// Get an environment variable, which will be passed through any validation
// and/or filtering that you specified with cleanEnv().
console.log(env.ADMIN_EMAIL)

// Shortcut (boolean) properties for checking the value of process.env.NODE_ENV
env.isProduction    // true if NODE_ENV === 'production'
env.isTesting       // true if NODE_ENV === 'test'
env.isDev           // true if NODE_ENV === 'development'
```


## Error Handling

TODO: update this section for v2


## Parse Functions

Node's process.env only stores strings, but sometimes you will want to retrieve other data
(eg. a boolean or a number). To achieve this, specify a parse function for your env var, and
the string in process.env will be passed through it when accessed by get().

For convenience, `env.toBool` and `env.toNumber` are available, which will return the
given type (and throw an error during validation if the env var can't be coerced
to the matching type). If you want to read in an array or object, you can use
JSON.parse as your parse function.

```js
// Assume for this example that process.env has MYBOOL='false', MYNUM='23', MYSTR='Hello'
const { cleanEnv, toBool, toNumber } = require('envalid')
const env = cleanEnv(process.env, {
    MYBOOL: { parse: env.toBool },
    MYNUM: { parse: env.toNumber },
    MYSTR: { parse: x => x.toLowerCase() }
});

env.MYBOOL      // -> false (a boolean, not a string)
env.MYNUM'      // -> 23
env.MYVAR'      // -> 'hello'
```


## Motivation

http://www.12factor.net/config
