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
completely rewritten from version 0.x - 1.x. The [older API docs](https://github.com/af/envalid/blob/0142d408ca1c83d47647c1781eeda37b4decd31d/README.md) are still available **


## API

### `envalid.cleanEnv(environment, validators, options)`

`cleanEnv()` returns a cleaned, immutable environment object, and accepts three
positional arguments:
     * an object containing your env vars (eg. process.env)
     * an object literal that specifies the format of required vars.
     * an object with options
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

// Envalid parses NODE_ENV automatically, and provides the follwong
// shortcut (boolean) properties for checking its value:
env.isProduction    // true if NODE_ENV === 'production'
env.isTesting       // true if NODE_ENV === 'test'
env.isDev           // true if NODE_ENV === 'development'
```

## Validator types

Node's process.env only stores strings, but sometimes you will want to retrieve other data
(eg. a boolean or a number), or validate that an env var is in a specific format (JSON,
url, email address). To these ends, the following validation functions are available:

* `str()` - Passes string values through, will ensure an value is present unless a
          `default` value is given.
* `bool()` - Parses env var strings `"0", "1", "true", "false", "t", "f"` into booleans
* `num()` - Parses an env var (eg. `"42", "0.23", "1e5"`) into a Number
* `email()` - Ensures an env var is an email address
* `url()` - Ensures an env var is a url with a protocol and hostname
* `json()` - Parses an env var with `JSON.parse`

Each validation function accepts an (optional) object with the following attributes:

* `desc` - A string that describes the env var.
* `choices` - An Array that gives the admissable parsed values for the env var.
* `default` - A fallback value, which will be used if the env var wasn't specified.
              This effectively makes the env var optional.

```js
// Assume for this example that process.env has MYBOOL='false', MYNUM='23', MYSTR='Hello'
const ev = require('envalid')
const env = ev.cleanEnv(process.env, {
    MYBOOL: ev.bool(),
    MYNUM: ev.num(),
    MYSTR: ev.str()
});

env.MYBOOL      // -> false (a boolean, not a string)
env.MYNUM'      // -> 23
env.MYVAR'      // -> 'hello'
```


## Error Reporting

By default, if any required environment variables are missing or have invalid
values, envalid will log a message and call `process.exit(1)`. You can override
this behavior by passing in your own function as `options.reporter`. For example:

```js
const env = cleanEnv(process.env, myValidators, {
    reporter: (errors, cleanedEnv) => {
        emailSiteAdmins('Invalid env vars: ' + Object.keys(errors))
    }
})
```


## `.env` File Support

Envalid wraps the very handy [dotenv](https://www.npmjs.com/package/dotenv) package,
so if you have a `.env` file in your project, envalid will read and validate the
env vars there as well.

## Motivation

http://www.12factor.net/config
