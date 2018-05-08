const envalid = require('..')

module.exports = envalid.cleanEnv(process.env, {
    HOST: envalid.host({ default: '127.0.0.1' }),
    PORT: envalid.port({ default: 3000, desc: 'The port to start the server on' }),

    // For this example, the MESSAGE env var will be read from the .env
    // file in this directory (so the default value won't be used):
    MESSAGE: envalid.str({ default: 'Hello, world' }),

    USE_TLS: envalid.bool({ defualt: false }),

    // If USE_TLS is true, this will throw if no value is provided (required)
    // If USE_TLS is false, this will not throw if no value is provided (optional)
    TLS_KEY_PATH: envalid.str({ requiredWhen: env => !!env.USE_TLS })
})
