process.env.DATABASE_DIRPATH = `${__dirname}/db`
process.env.SCRAPER_DIRPATH = `${__dirname}/scraper`

const Scraper = require(`${process.env.SCRAPER_DIRPATH}/scraper.js`);
const DatabaseManager = require(`${process.env.DATABASE_DIRPATH}/database-manager.js`)

let scraper = new Scraper();
scraper.start();

let db = new DatabaseManager();
setInterval(async () => {
    for (let name of ['S31 - UPS', 'S31 - NETMOX', 'S31 - MAINMOX', 'S31 - TRUENAS']){
        let polls = await db.selectPollsByPlugName(name);
        // console.log(name, polls.length);
    }
}, 5000);