// Toy envalid example app.
//
// This will start up an http server using the port and hostname specified in either:
// 1) The process.env object, or
// 2) Default values passed to envalid (via the 'default' or 'devDefault' properties.)
//
// From the root of the project, try the following commands and check out `env.js` to see how
// Envalid works:
//
//    node example/server.js
//
//    PORT=1337 node example/server.js
//
//    MESSAGE="hey there" node example/server.js
//
//    NODE_ENV=development node example/server.js

const http = require('http')
const env = require('./env')

const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end(env.MESSAGE)
})

server.listen(env.PORT, env.HOST, () => {
  const serverType = env.isProduction ? 'production' : 'dev'
  console.log(`Server (${serverType}) running at http://${env.HOST}:${env.PORT}/`)
})
