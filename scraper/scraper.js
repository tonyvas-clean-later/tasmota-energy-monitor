const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const DatabaseManager = require(`${process.env.DATABASE_DIRPATH}/database-manager.js`)

const ERROR_PREFIX = 'Scraper'
const SCRAPE_INTERVAL_MS = 1000;

const URL = "http://homeassistant.pve-2.home.lan:9541/devices";
const VIEWPORT = {width: 1080, height: 1024};

class Scraper{
    constructor() {
        this.db = new DatabaseManager();
    }

    async start(){
        try {
            // Start a browser and open new page
            let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
            let page = await browser.newPage();

            // Navigate to tasmoadmin page
            await page.goto(URL);
            await page.setViewport(VIEWPORT);

            // Start a timer to scrape and parse content from page
            setInterval(() => {
                // Scrape page
                this.run(page).catch(console.error)
            }, SCRAPE_INTERVAL_MS);
        } catch (error) {
            throw new Error(`${ERROR_PREFIX}.start: failed to navigate website \n\t${error.message}`)
        }
    }

    async run(page){
        try {
            // Get current timestamp
            let timestampMS = new Date().getTime();

            // Get html from page and scrape it for plug data
            let html = await page.content();
            let plugs = this.scrape(html);
            
            // Try pushing each plug to the database
            for (let plug of plugs){
                try {
                    await this.db.addPoll(plug['name'], timestampMS, plug['runtime'], plug['energy']);
                } catch (error) {
                    console.error(error);
                }
            }
        } catch (error) {
            throw new Error(`${ERROR_PREFIX}.run: failed to get plugs \n\t${error.message}`)
        }
    }

    scrape(html){
        try {
            let plugs = [];
            let $ = cheerio.load(html);

            // Iterate over the table rows for each plug
            for (let row of $('#device-list').find('tbody').find('tr')){
                // Get plug data
                plugs.push(this.getPlugDataFromRow($, row));
            }

            return plugs;
        } catch (error) {
            throw new Error(`${ERROR_PREFIX}.scrape: failed to scrape website \n\t${error.message}`)
        }
    }

    getPlugDataFromRow($, row){
        try {
            let plug = {};

            // Iterate over every cell in table row
            for (let cell of $(row).find('td')){
                // Get key representing value of cell
                let key = $(cell).find('b').text().trim();

                // Check if key is relevant, handle if it is
                switch (key) {
                    case 'Name':
                        plug['name'] = this.parseName($, cell);
                        break;
                    case 'Runtime':
                        plug['runtime'] = this.parseRuntime($, cell);
                        break;
                    case 'Energy':
                        plug['energy'] = this.parseEnergy($, cell);
                        break;
                }
            }

            return plug;
        } catch (error) {
            throw new Error(`${ERROR_PREFIX}.getPlugDataFromRow: failed to get plug data \n\t${error.message}`)
        }
    }

    parseName($, cell){
        let name = $(cell).find('a').text().trim();

        // Remove evil non-breaking space
        return name.replace(new RegExp(String.fromCharCode(160), 'g'), ' ');
    }

    parseRuntime($, cell){
        const MULTIPLIERS = {
            's': 1,
            'm': 60,
            'h': 60 * 60,
            'd': 24 * 60 * 60
        }

        // Get the string version of runtime
        let runtimeStr = $(cell).find('span').text().trim();
        let runtimeS = 0;

        // Convert string to seconds
        for (let part of runtimeStr.split(' ')){
            let value = part.substring(0, part.length - 1);
            let key = part.substring(part.length - 1)

            runtimeS += value * MULTIPLIERS[key];
        }

        return runtimeS
    }

    parseEnergy($, cell){
        // First value of energy cell
        return Number($(cell).find('span').text().trim().split(' ')[0])
    }
}

module.exports = Scraper
