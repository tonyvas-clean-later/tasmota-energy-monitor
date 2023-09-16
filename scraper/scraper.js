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
            let browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
            let page = await browser.newPage();

            await page.goto(URL);
            await page.setViewport(VIEWPORT);

            setInterval(() => {
                this.run(page).catch(console.error)
            }, 1000);
        } catch (error) {
            throw new Error(`${ERROR_PREFIX}.start: failed to navigate website \n\t${error.message}`)
        }
    }

    async run(page){
        try {
            let timestampMS = new Date().getTime();
            let html = await page.content();
            let plugs = this.scrape(html);
            
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

            for (let row of $('#device-list').find('tbody').find('tr')){
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

            for (let cell of $(row).find('td')){
                let key = $(cell).find('b').text().trim();

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

        let runtimeStr = $(cell).find('span').text().trim();
        let runtimeS = 0;

        for (let part of runtimeStr.split(' ')){
            let value = part.substring(0, part.length - 1);
            let key = part.substring(part.length - 1)

            runtimeS += value * MULTIPLIERS[key];
        }

        return runtimeS
    }

    parseEnergy($, cell){
        return Number($(cell).find('span').text().trim().split(' ')[0])
    }
}

module.exports = Scraper
