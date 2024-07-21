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
const https = require('https')
const env = require('./env')

var options = {
  key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('test/fixtures/keys/agent2-cert.cert')
};

const serverBody = (req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain')
  res.end(env.MESSAGE)
}

const server = (env.USE_TLS)? http.createServer(serverBody): https.createServer({
  key: fs.readFileSync(env.TLS_KEY_PATH),
  cert: fs.readFileSync(env.TLS_CERT_PATH)
},serverBody);

server.listen(env.PORT, env.HOST, () => {
  const serverType = env.isProduction ? 'production' : 'dev'
  console.log(`Server (${serverType}) running at http://${env.HOST}:${env.PORT}/`)
})
