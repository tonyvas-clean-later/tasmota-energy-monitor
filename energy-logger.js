const fs = require('fs');
const EnergyMonitor = require('./energy-monitor');

const DUMP_LOG_PATH = `${__dirname}/dump`

class EnergyLogger{
    constructor(configPath) {
        this.configPath = configPath;
        this.plugs = {};
    }

    start() {
        return new Promise((resolve, reject) => {
            this.readConfig().then(config => {
                for (let plug in config){
                    let name = config[plug].name;
                    let address = config[plug].address;
                    let interval = config[plug].poll_interval;

                    this.plugs[name] = new EnergyMonitor(name, address, interval);
                    this.plugs[name].start(data => {
                        this.onData(plug, data);
                    }, error => {
                        this.onError(plug, error);
                    })
                }

                resolve();
            }).catch(reject);
        })
    }

    onData(plug, data){
        try{
            let date = new Date();
            let year = date.getFullYear();
            let month = String(date.getMonth()).padStart(2, '0');
            let day = String(date.getDay()).padStart(2, '0');

            let name = `${plug}_${year}-${month}-${day}`;
            let path = `${DUMP_LOG_PATH}/${name}.csv`

            let line = [`Time:${date.getTime()}`];
            for (let entry of Object.entries(data)){
                line.push(entry.join(':'))
            }

            fs.appendFile(path, line.join(',') + '\n', err => {
                if (err){
                    console.error(err);
                }
            })
        }
        catch(err){
            console.error(plug, err);
        }
    }

    onError(plug, error){
        console.error(plug, error);
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

module.exports = EnergyLogger