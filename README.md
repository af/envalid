Envalid is a small library for validating and accessing environment variables in
Node.js programs.


## API

    var env = require('envalid');

    // Validate your environment variables.
    // myValidators is an object literal that specifies the format of required vars.
    // This will throw an exception if any required conditions are not met.
    env.validate(process.env, {
        NODE_ENV: { required: true, choices: [ 'production', 'test', 'development' ] },
        ADMIN_EMAIL: { required: true, regex: /.+@.+\..+/ },
        EMAIL_CONFIG_JSON: { recommended: true, parse: JSON.parse,
                             help: 'Additional email configuration parameters' }
    });

    // Supported keys for env var specifications:
    // required - This env var must be provided, or validate() will throw an exception
    // recommended - This env var is not required, but if it is not provided, a warning will be logged
    // help - Points to a string that describes the env var.
    // choices - Points to an array that gives the supported string values for the env var.
    // regex - Points to a regular expression that the env var must match (or an exception will be thrown)
    // parse - Points to a function that the env var will be passed through before being accessed with get()


    // Get an environment variable, which will be passed through any validation
    // and/or filtering that you specified with env.validate().
    // The second (optional) argument is a default value that will be returned
    // if the environment variable is not set.
    env.get('ADMIN_EMAIL', 'defaultaddress@example.com')

    // Set an environment variable to a given value.
    // This will throw an exception if the value given is invalid.
    env.set('ADMIN_EMAIL', 'admin@example.com')

    // Shortcut (boolean) properties for checking the value of process.env.NODE_ENV
    env.isProduction    // true if NODE_ENV === 'production'
    env.isTesting       // true if NODE_ENV === 'test'
    env.isDev           // true if NODE_ENV === 'development'


## Motivation

http://www.12factor.net/config
