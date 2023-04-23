const express = require('express')
const http = require('http')

const DEFAULT_PORT = 8080

let port = process.env.PORT || DEFAULT_PORT
let app = express()
let server = http.createServer(app)

// Log all requests
app.all("*", (req, res, next) => {
    console.log(`${new Date().toLocaleString()} | ${req.method} | ${req.socket.remoteAddress} | ${req.url}`);
    next();
});

// GET homepage
app.get('/', (req, res) => {
    res.end('oi!')
})

// Start server
server.listen(port, () => {
    console.log('HTTP server started!');
})