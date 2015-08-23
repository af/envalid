[![Build Status](https://secure.travis-ci.org/af/envalid.png)](http://travis-ci.org/af/envalid)

Envalid is a small library for validating and accessing environment variables in
Node.js programs.

Validating your env vars:

* gives you executable documentation about the environment your program is expected to run in
* helps you treat your env vars like a well-tested module, rather than a random grab bag of global strings


## API

```js
var env = require('envalid');

// Validate your environment variables.
// Takes two positional arguments:
//      * an object containing your env vars (eg. process.env)
//      * an object literal that specifies the format of required vars.
// This will throw an exception if any required conditions are not met.
env.validate(process.env, {
    NODE_ENV: { required: true, choices: [ 'production', 'test', 'development' ] },
    ADMIN_EMAIL: { required: true, regex: /.+@mydomain\.com/ },
    EMAIL_CONFIG_JSON: { recommended: true, parse: JSON.parse,
                         help: 'Additional email configuration parameters' }
});

// Supported keys for env var specifications:
// required - This env var must be provided, or validate() will throw an exception
// recommended - This env var is not required, but if it is not provided, a warning will be logged
// help - A string that describes the env var.
// choices - An Array that gives the supported string values for the env var.
// regex - A RegExp that the env var must match (or an exception will be thrown)
// parse - A function the env var will be passed through before being accessed with get()
// default - A fallback value that get() will return if the env var wasn't specified


// Get an environment variable, which will be passed through any validation
// and/or filtering that you specified with env.validate().
// The second (optional) argument is a default value that will be returned
// if the environment variable is not set.
// NOTE: get() will only give access to env vars that were parsed by validate() or set()
env.get('ADMIN_EMAIL')
env.get('NOT_A_REAL_VAR', 'this string will be returned')

// Set an environment variable to a given value.
// This will throw an exception if the value given is invalid.
env.set('ADMIN_EMAIL', 'admin@example.com')

// Shortcut (boolean) properties for checking the value of process.env.NODE_ENV
env.isProduction    // true if NODE_ENV === 'production'
env.isTesting       // true if NODE_ENV === 'test'
env.isDev           // true if NODE_ENV === 'development'
```


## Error Handling

There are two functions that handle errors: `env.onError` (used when there are any missing
required env vars or validation errors) and `env.onRecommend`. The default behaviour for these
functions is as follows:

onError: log all of the env vars that failed validation, and shut down the process with `process.exit(1)`
onRecommend: log all of the env vars that are recommended, but were not provided.

You can override either function by overwriting the functions from the module, for example:

```js
var env = require('envalid');
env.onRecommend = function(recs) {
    console.warn('Missing env vars:', Object.keys(recs).join(','));
};
env.validate( ... );
```


## Parse Functions

Node's process.env only stores strings, but sometimes you will want to retrieve other data
(eg. a boolean or a number). To achieve this, specify a parse function for your env var, and
the string in process.env will be passed through it when accessed by get().

For convenience, `env.toNumber` and `env.toBoolean` are available, which will return the
given type (and throw an error during validation if the env var isn't of the matching type).
If you want to store an array or hash, you can use JSON.parse as your parse function.

```js
// Assume for this example that process.env has MYBOOL='false', MYNUM='23', MYVAR='Hello'
env.validate(process.env, {
    MYBOOL: { parse: env.toBoolean },
    MYNUM: { parse: env.toNumber },
    MYVAR: { parse: function(x) { return x.toLowerCase() } }
});

env.get('MYBOOL');      // Returns false (a boolean, not a string)
env.get('MYNUM');       // Returns 23
env.get('MYVAR');       // Returns 'hello'
```


## Motivation

http://www.12factor.net/config
