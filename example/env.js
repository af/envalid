const envalid = require('../')

module.exports = envalid.cleanEnv(process.env, {
  HOST: envalid.host({ default: '127.0.0.1' }),
  PORT: envalid.port({ default: 3000, desc: 'The port to start the server on' }),
  MESSAGE: envalid.str({ default: 'Hello, world' }),
})
