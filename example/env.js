const envalid = require('../')

module.exports = envalid.cleanEnv(process.env, {
    HOST: envalid.host({ default: '127.0.0.1' }),
    PORT: envalid.port({ default: 3000, desc: 'The port to start the server on' }),

    // For this example, the MESSAGE env var will be read from the .env
    // file in this directory (so the default value won't be used):
    MESSAGE: envalid.str({ default: 'Hello, world' }),
})
