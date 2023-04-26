const http = require('http');

const ERROR_PREFIX = 'Plug error'

// URI to get relevant status info
const HTTP_URI = 'cm?cmnd=status%2010';
const ENERGY_RESPONSE_KEYS = ['Voltage', 'Current', 'Factor', 'Power', 'ApparentPower', 'ReactivePower']

class Plug{
    constructor(address){
        this.address = address;
    }

    fetch(){
        return new Promise((resolve, reject) => {
            // Form the url to request
            let url = `http://${this.address}/${HTTP_URI}`

            http.get(url, res => {
                // Check if plug responded correctly
                if (res.statusCode == 200){
                    let data = [];
                    
                    // Read data chunks from response
                    res.on('data', d => {
                        data.push(d);
                    })

                    res.on('end', () => {
                        try{
                            // Parse json data from response
                            let json = JSON.parse(Buffer.concat(data).toString())
                            // Get relevant energy object from response
                            let energy = json.StatusSNS.ENERGY;
                            let values = {};

                            // Get relevant fields from response object
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