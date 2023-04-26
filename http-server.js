const express = require('express')
const http = require('http')

const ERROR_PREFIX = 'HTTP server error'

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
                    try{
                        console.log(`${new Date().toLocaleString()} | ${req.method} | ${req.socket.remoteAddress} | ${req.url}`);
                        next();
                    }
                    catch(err){
                        console.error(`${ERROR_PREFIX}: failed to log request!`, err);
                    }
                });

                // GET homepage
                this.app.get('/', (req, res) => {
                    try{
                        res.end('oi!')
                    }
                    catch(err){
                        console.error(`${ERROR_PREFIX}: failed to server default response!`, err);
                    }
                })

                // Start server
                this.server.listen(this.port, () => {
                    resolve();
                })
            } catch (e) {
                reject(new Error(`${ERROR_PREFIX}: failed to start HTTP server`, e))
            }
        })
    }
}

module.exports = HTTPServer