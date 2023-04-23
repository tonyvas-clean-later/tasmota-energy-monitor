const fs = require('fs');
const EnergyMonitor = require('./energy-monitor');

class EnergyLogger{
    constructor(configPath) {
        this.configPath = configPath;
    }

    start() {
        return new Promise((resolve, reject) => {
            this.readConfig().then(config => {
                resolve(config)
            }).catch(reject);
        })
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