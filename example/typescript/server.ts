// Toy envalid example app.

// This will start up an http server using the port and hostname specified in
// any of three places. In descending order of preference, these are:
// 1) The process environment
// 2) A '.env' file
// 3) Default values passed to envalid (via the 'default' or 'devDefault' properties.)

import http from 'http'
import env from './env'

const server = http.createServer((req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    res.end(env.MESSAGE)
})

server.listen(env.PORT, env.HOST, () => {
    const serverType = env.isProduction ? 'production' : 'dev'
    console.log(`Server (${serverType}) running at http://${env.HOST}:${env.PORT}/`)
})

// Because we've passed `strict: true` when running `envalid.cleanEnv`, if we
// try to access any properties we didn't specify in our config, TypeScript will
// flag them as an error. Try uncommenting the line below:

// const whatever = env.INVALID_ENV_VAR
