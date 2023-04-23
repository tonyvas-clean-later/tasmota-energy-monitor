const http = require('http');

const HTTP_URI = 'cm?cmnd=status%2010';
const ENERGY_RESPONSE_KEYS = ['Voltage', 'Current', 'Factor', 'Power', 'ApparentPower', 'ReactivePower']

class EnergyMonitor{
    constructor(name, address, interval){
        this.name = name;
        this.address = address;
        this.interval = interval;
    }

    start(onData, onError){
        this.handle = setInterval(() => {
            this.fetch().then(onData).catch(onError);
        }, this.interval);
    }

    fetch(){
        return new Promise((resolve, reject) => {
            let url = `http://${this.address}/${HTTP_URI}`

            http.get(url, res => {
                if (res.statusCode == 200){
                    let data = [];
                    
                    res.on('data', d => {
                        data.push(d);
                    })

                    res.on('end', () => {
                        let json = JSON.parse(Buffer.concat(data).toString())
                        let energy = json.StatusSNS.ENERGY;
                        let values = {};

                        for (let key of ENERGY_RESPONSE_KEYS){
                            values[key] = energy[key];
                        }

                        resolve(values);
                    })
                }
                else{
                    reject(`${this.name}: ${res.statusCode}`);
                }
            }).on('error', err => {
                reject(err);
            });
        })
    }
}

module.exports = EnergyMonitor