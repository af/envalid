// Toy envalid example app.
// This will start up an http server using the

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
