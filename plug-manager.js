const fs = require('fs');
const Plug = require('./plug');

const ERROR_PREFIX = 'PlugManager error'

const DUMP_LOG_PATH = `${__dirname}/dump`
const POLL_INTERVAL_MS = 5000;

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
            // Setup plugs
            this.setup().then(() => {
                // Start fetch interval timer for all plugs
                for (let name in this.plugs){
                    this.handles[name] = setInterval(() => {
                        this.plugs[name].fetch().then(data => {
                            // Write data they respond with
                            this.writeData(name, data)
                        }).catch(err => {
                            console.error(`${ERROR_PREFIX}: failed to fetch plug ${name}`, err);
                        })
                    }, POLL_INTERVAL_MS);
                }

                resolve();
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}: failed to setup plugs`, err))
            })
        })
    }

    setup(){
        return new Promise((resolve, reject) => {
            // Get plug configs
            this.readConfig().then(configs => {
                for (let config of configs){
                    // Create plugs using config values
                    let name = config.name;
                    let address = config.address;

                    this.plugs[name] = new Plug(address);
                }

                resolve();
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}: failed to get plugs config`, err))
            });
        })
    }

    getDumpFilepath(name, date){
        // Get date parts from date
        let year = date.getFullYear();
        // Month value with padding (01..12)
        let month = String(date.getMonth() + 1).padStart(2, '0');
        // Day of month value with padding (01..31)
        let day = String(date.getDate()).padStart(2, '0');

        // CSV filename
        let filename = `${name}_${year}-${month}-${day}.csv`;
        // CSV filepath with directory
        let filepath = `${DUMP_LOG_PATH}/${filename}`

        return filepath;
    }

    writeData(name, data){
        return new Promise((resolve, reject) => {
            try{
                // Get current date
                let date = new Date();
                // Location to write data to
                let path = this.getDumpFilepath(name, date);
    
                // List of values to write into CSV
                let values = [];
    
                // Time value
                values.push([TIME_KEY, date.getTime()].join(KEY_VALUE_SEPARATOR));
                
                // Plug data containing the object key/value pair
                for (let entry of Object.entries(data)){
                    values.push(entry.join(KEY_VALUE_SEPARATOR))
                }
    
                // Write data to CSV file
                fs.appendFile(path, values.join(CSV_SEPARATOR) + '\n', err => {
                    if (err){
                        reject(new Error(`${ERROR_PREFIX}: failed to write data`, err))
                    }
                    else{
                        resolve();
                    }
                })
            }
            catch(err){
                reject(new Error(`${ERROR_PREFIX}: failed to parse plug data for writing`, err))
            }
        })
    }

    readConfig(){
        return new Promise((resolve, reject) => {
            // Read config file
            fs.readFile(this.configPath, 'utf-8', (err, data) => {
                if (err){
                    reject(new Error(`${ERROR_PREFIX}: failed to read config file`, err))
                }
                else{
                    try{
                        // Parse json
                        resolve(JSON.parse(data));
                    }
                    catch(err){
                        reject(new Error(`${ERROR_PREFIX}: failed to parse json config from file`, err))
                    }
                }
            })
        })
    }
}

module.exports = PlugManager
