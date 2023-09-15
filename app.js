process.env.DATABASE_DIRPATH = `${__dirname}/db`
process.env.SCRAPER_DIRPATH = `${__dirname}/scraper`

const Scraper = require(`${process.env.SCRAPER_DIRPATH}/scraper.js`);

let scraper = new Scraper();
scraper.runbs();