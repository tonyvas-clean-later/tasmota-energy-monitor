const HTTPServer = require('./http-server')
const PlugManager = require('./plug-manager');

const DEFAULT_PORT = 8080
const DEFAULT_PLUG_CONFIG = `${__dirname}/plugs.json`

// Start all services
start().then(() => {
    console.log('Service running!');
}).catch(err => {
    console.error('Error: failed to start main service', err);
})

function start(){
    return new Promise((resolve, reject) => {
        // Read values from env, or assume default
        let port = process.env.PORT || DEFAULT_PORT
        let plugsConfig = process.env.PLUG_CONFIG || DEFAULT_PLUG_CONFIG;
        
        // Start services
        let promises = [
            startHTTP(port),
            startPlugManager(plugsConfig)
        ]

        // Wait for services to start successfully, or fail
        Promise.all(promises).then(resolve).catch(reject);
    })
}

function startHTTP(port){
    return new Promise((resolve, reject) => {
        // Start HTTP server
        new HTTPServer(port).start(() => {
            resolve();
        }).catch(err => {
            reject(new Error('Failed to start HTTP server', err))
        })
    })
}

function startPlugManager(plugsConfig){
    return new Promise((resolve, reject) => {
        // Start plug manager service
        new PlugManager(plugsConfig).start(() => {
            resolve()
        }).catch(err => {
            reject(new Error('Failed to start PlugManager service', err))
        })
    })
}