const fs = require('fs');
const Plug = require('./plug');

const DUMP_LOG_PATH = `${__dirname}/dump`
const POLL_INTERVAL_MS = 1000;

const TIME_KEY = 'Time'
const KEY_VALUE_SEPARATOR = ':'
const CSV_SEPARATOR = ',';

class PlugManager{
    constructor(configPath) {
        this.configPath = configPath;
        this.plugs = {};
        this.handles = {};
    }

    start() {
        return new Promise((resolve, reject) => {
            this.setup().then(() => {
                for (let name in this.plugs){
                    this.handles[name] = setInterval(() => {
                        this.plugs[name].fetch().then(data => {
                            this.writeData(name, data)
                        }).catch(err => {
                            console.error(err);
                        })
                    }, POLL_INTERVAL_MS);
                }

                resolve();
            }).catch(err => {
                console.error(err);
            })
        })
    }

    setup(){
        return new Promise((resolve, reject) => {
            this.readConfig().then(configs => {
                for (let config of configs){
                    let name = config.name;
                    let address = config.address;

                    this.plugs[name] = new Plug(address);
                }

                resolve();
            }).catch(reject);
        })
    }

    getDumpFilepath(name, date){
        let year = date.getFullYear();
        let month = String(date.getMonth() + 1).padStart(2, '0');
        let day = String(date.getDate()).padStart(2, '0');

        let filename = `${name}_${year}-${month}-${day}.csv`;
        let filepath = `${DUMP_LOG_PATH}/${filename}`

        return filepath;
    }

    writeData(name, data){
        try{
            let date = new Date();
            let path = this.getDumpFilepath(name, date);

            let values = [];

            values.push([TIME_KEY, date.getTime()].join(KEY_VALUE_SEPARATOR));
            
            for (let entry of Object.entries(data)){
                values.push(entry.join(KEY_VALUE_SEPARATOR))
            }

            fs.appendFile(path, values.join(CSV_SEPARATOR) + '\n', err => {
                if (err){
                    console.error(err);
                }
            })
        }
        catch(err){
            console.error(name, err);
        }
    }

    readConfig(){
        return new Promise((resolve, reject) => {
            fs.readFile(this.configPath, 'utf-8', (err, data) => {
                if (err){
                    reject(err)
                }
                else{
                    try{
                        resolve(JSON.parse(data));
                    }
                    catch(err){
                        reject(err)
                    }
                }
            })
        })
    }
}

module.exports = PlugManager
