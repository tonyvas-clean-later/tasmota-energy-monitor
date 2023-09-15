const sqlite3 = require('sqlite3')

const ERROR_PREFIX = 'DatabaseManager'
const DATABASE_FILE = `${process.env.DATABASE_DIRPATH}/database.db`

class DatabaseManager{
    constructor() {
        this._isSetUp = false;
    }

    _checkSetup(){
        return new Promise((resolve, reject) => {
            const SQL = 'SELECT COUNT(*) FROM plug, poll;'

            if (this._isSetUp){
                resolve(true);
            }
            else{
                this._queryAll(SQL).then(res => {
                    resolve(true);
                }).catch(err => {
                    resolve(false);
                })
            }
        })
    }

    _setupIfNeeded(){
        return new Promise((resolve, reject) => {
            const SQL = `
                CREATE TABLE IF NOT EXISTS plug(
                    plug_id         INTEGER     PRIMARY KEY AUTOINCREMENT, 
                    name            TEXT(20)    NOT NULL UNIQUE
                );
                CREATE TABLE IF NOT EXISTS poll(
                    poll_id         INTEGER     PRIMARY KEY AUTOINCREMENT, 
                    plug_id         INTEGER     NOT NULL, 
                    timestamp_ms    INTEGER     NOT NULL, 
                    runtime_s       INTEGER     NOT NULL, 
                    power_w         REAL        NOT NULL, 
                    
                    FOREIGN KEY(plug_id) REFERENCES plug (plug_id)
                );
            `

            this._checkSetup().then(isSetUp => {
                if (isSetUp){
                    resolve();
                }
                else{
                    this._queryExec(SQL).then(res => {
                        this._checkSetup().then(isSetUp => {
                            if (isSetUp){
                                this._isSetUp = true;
                                resolve()
                            }
                            else{
                                reject(new Error(`${ERROR_PREFIX}._setupIfNeeded: failed to setup database \n\t${err.message}`));
                            }
                        }).catch(err => {
                            reject(new Error(`${ERROR_PREFIX}._setupIfNeeded: failed to failed to check if database is setup again \n\t${err.message}`));
                        })
                    }).catch(err => {
                        reject(new Error(`${ERROR_PREFIX}._setupIfNeeded: failed to run query \n\t${err.message}`));
                    })
                }
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}._setupIfNeeded: failed to check if database is setup \n\t${err.message}`));
            })
        })
    }

    _connect(){
        return new Promise((resolve, reject) => {
            let db = new sqlite3.Database(DATABASE_FILE, err => {
                if (err){
                    reject(new Error(`${ERROR_PREFIX}._connect: failed to connect to database \n\t${err.message}`));
                }
                else{
                    resolve(db);
                }
            })
        })
    }

    _queryAll(sql){
        return new Promise((resolve, reject) => {
            this._connect().then(db => {
                db.all(sql, (err, res) => {
                    if (err){
                        reject(new Error(`${ERROR_PREFIX}._queryAll: failed to run query \n\t${err.message}`));
                    }
                    else{
                        resolve(res);
                    }
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}._queryAll: failed to connect to database \n\t${err.message}`));
            })
        })
    }

    _queryExec(sql){
        return new Promise((resolve, reject) => {
            this._connect().then(db => {
                db.exec(sql, err => {
                    if (err){
                        reject(new Error(`${ERROR_PREFIX}._queryExec: failed to run query \n\t${err.message}`));
                    }
                    else{
                        resolve();
                    }
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}._queryExec: failed to connect to database \n\t${err.message}`));
            })
        })
    }

    addPoll(name, timestamp_ms, runtime_s, power_w){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                this.checkPlugExistsByName(name).then(exists => {
                    let promises = [];
                    
                    if (!exists){
                        promises.push(this.insertPlug(name));
                    }

                    Promise.all(promises).then(() => {
                        this.selectPlugByName(name).then(plug => {
                            let plug_id = plug[0].plug_id;
                            this.insertPoll(plug_id, timestamp_ms, runtime_s, power_w).then(() => {
                                resolve()
                            }).catch(err => {
                                reject(new Error(`${ERROR_PREFIX}.addPoll: failed to insert poll \n\t${err.message}`));
                            })
                        }).catch(err => {
                            reject(new Error(`${ERROR_PREFIX}.addPoll: failed to select plug \n\t${err.message}`));
                        })
                    }).catch(err => {
                        reject(new Error(`${ERROR_PREFIX}.addPoll: failed to insert plug \n\t${err.message}`));
                    })
                }).catch(err => {
                    reject(new Error(`${ERROR_PREFIX}.addPoll: failed to check if plug exists \n\t${err.message}`));
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}.addPoll: failed to setup database \n\t${err.message}`));
            })
        })
    }

    checkPlugExistsByName(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                this.selectPlugByName(name).then(res => {
                    resolve(res.length > 0);
                }).catch(err => {
                    reject(new Error(`${ERROR_PREFIX}.checkPlugExistsByName: failed to get plug \n\t${err.message}`));
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}.checkPlugExistsByName: failed to setup database \n\t${err.message}`));
            })
        })
    }

    insertPlug(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                this._queryAll(`INSERT INTO plug(name) VALUES("${name}")`).then(res => {
                    resolve();
                }).catch(err => {
                    reject(new Error(`${ERROR_PREFIX}.insertPlug: failed to run query \n\t${err.message}`));
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}.insertPlug: failed to setup database \n\t${err.message}`));
            })
        })
    }

    insertPoll(plug_id, timestamp_ms, runtime_s, power_w){
        return new Promise((resolve, reject) => {
            const SQL = `
                INSERT INTO poll(
                    plug_id, timestamp_ms, runtime_s, power_w
                ) VALUES(
                    ${plug_id}, ${timestamp_ms}, ${runtime_s}, ${power_w}
                );
            `

            this._setupIfNeeded().then(() => {
                this._queryAll(SQL).then(res => {
                    resolve();
                }).catch(err => {
                    reject(new Error(`${ERROR_PREFIX}.insertPoll: failed to run query \n\t${err.message}`));
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}.insertPoll: failed to setup database \n\t${err.message}`));
            })
        })
    }

    selectPlugByName(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                this._queryAll(`SELECT * FROM plug WHERE name = "${name}"`).then(res => {
                    resolve(res);
                }).catch(err => {
                    reject(new Error(`${ERROR_PREFIX}.selectPlugByName: failed to run query \n\t${err.message}`));
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}.selectPlugByName: failed to setup database \n\t${err.message}`));
            })
        })
    }

    selectPollsByPlugName(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                this._queryAll(`SELECT * FROM plug, poll WHERE plug.plug_id = poll.plug_id AND name = "${name}"`).then(res => {
                    resolve(res);
                }).catch(err => {
                    reject(new Error(`${ERROR_PREFIX}.selectPollsByPlugName: failed to run query \n\t${err.message}`));
                }) 
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}.selectPollsByPlugName: failed to setup database \n\t${err.message}`));
            })
        })
    }
}

module.exports = DatabaseManager
