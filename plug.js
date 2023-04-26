const http = require('http');

const ERROR_PREFIX = 'Plug error'

const HTTP_URI = 'cm?cmnd=status%2010';
const ENERGY_RESPONSE_KEYS = ['Voltage', 'Current', 'Factor', 'Power', 'ApparentPower', 'ReactivePower']

class Plug{
    constructor(address){
        this.address = address;
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
                        try{
                            let json = JSON.parse(Buffer.concat(data).toString())
                            let energy = json.StatusSNS.ENERGY;
                            let values = {};

                            for (let key of ENERGY_RESPONSE_KEYS){
                                values[key] = energy[key];
                            }

                            resolve(values);
                        }
                        catch(err){
                            reject(new Error(`${ERROR_PREFIX}: failed to parse plug json response data`, err))
                        }
                    })
                }
                else{
                    reject(new Error(`${ERROR_PREFIX}: plug fetch responded with status code ${res.statusCode}`));
                }
            }).on('error', err => {
                reject(new Error(`${ERROR_PREFIX}: failed to send fetch request`, err));
            });
        })
    }
}

module.exports = Plug