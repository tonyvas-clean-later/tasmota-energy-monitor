const DatabaseManager = require(`${process.env.DATABASE_DIRPATH}/database-manager.js`)

class Scraper{
    constructor() {
        this.db = new DatabaseManager();
    }

    async runbs(){
        let bs = [
            {a: 'a', 'b': 1, 'c': 2, 'd': 3},
            {a: 'a', 'b': 10, 'c': 20, 'd': 30},
            {a: 'a', 'b': 100, 'c': 200, 'd': 300},
            {a: 'b', 'b': 7, 'c': 8, 'd': 9},
            {a: 'b', 'b': 77, 'c': 88, 'd': 99},
            {a: 'b', 'b': 777, 'c': 888, 'd': 999},
        ]

        for (let s of bs){
            await this.db.addPoll(s.a, s.b, s.c, s.d)
        }

        let a = await this.db.selectPollsByPlugName('a');
        let b = await this.db.selectPollsByPlugName('b');

        console.log(a);
        console.log(b);
    }
}

module.exports = Scraper
