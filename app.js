const HTTPServer = require('./http-server')
const PlugManager = require('./plug-manager');

const DEFAULT_PORT = 8080
const DEFAULT_PLUG_CONFIG = `${__dirname}/plugs.json`

start().then(() => {
    console.log('Service running!');
}).catch(err => {
    console.error('Error:', err);
})

function start(){
    return new Promise((resolve, reject) => {
        let port = process.env.PORT || DEFAULT_PORT
        let plugsConfig = process.env.PLUG_CONFIG || DEFAULT_PLUG_CONFIG;
        
        let promises = [
            startHTTP(port),
            startPlugManager(plugsConfig)
        ]

        Promise.all(promises).then(resolve).catch(reject);
    })
}

function startHTTP(port){
    return new Promise((resolve, reject) => {
        let http = new HTTPServer(port);
        http.start(() => {
            resolve(http);
        }).catch(reject)
    })
}

function startPlugManager(plugsConfig){
    return new Promise((resolve, reject) => {
        let manager = new PlugManager(plugsConfig);
        manager.start(() => {
            resolve(manager)
        }).catch(reject)
    })
}