const express = require('express')
const http = require('http')

class HTTPServer {
    constructor(port) {
        this.port = port;
    }

    start() {
        return new Promise((resolve, reject) => {
            try {
                this.app = express()
                this.server = http.createServer(this.app)

                // Log all requests
                this.app.all("*", (req, res, next) => {
                    console.log(`${new Date().toLocaleString()} | ${req.method} | ${req.socket.remoteAddress} | ${req.url}`);
                    next();
                });

                // GET homepage
                this.app.get('/', (req, res) => {
                    res.end('oi!')
                })

                // Start server
                this.server.listen(this.port, () => {
                    resolve();
                })
            } catch (e) {
                reject(e)
            }
        })
    }
}

module.exports = HTTPServer