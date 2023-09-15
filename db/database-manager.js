const sqlite3 = require('sqlite3')

const ERROR_PREFIX = 'DatabaseManager'
const DATABASE_FILE = `${process.env.DATABASE_DIRPATH}/database.db`

class DatabaseManager{
    constructor() {
        // Bool flag to check if the database has been setup
        // Assume false until verified to be true
        this._isSetUp = false;
    }

    // Check the database setup
    // Resolves with true or false depending on whether the database is set up
    _checkSetup(){
        return new Promise((resolve, reject) => {
            // Try selecting from the tables
            const SQL = 'SELECT COUNT(*) FROM plug, poll;'

            // Skip if database has been checked before
            if (this._isSetUp){
                resolve(true);
            }
            else{
                // Try running the query and resolve depending on result
                this._queryAll(SQL).then(res => {
                    resolve(true);
                }).catch(err => {
                    resolve(false);
                })
            }
        })
    }

    // Checks and sets up the database if needed
    _setupIfNeeded(){
        return new Promise((resolve, reject) => {
            // Create the 2 tables
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

            // Check if already set up
            this._checkSetup().then(isSetUp => {
                if (isSetUp){
                    resolve();
                }
                else{
                    // If not, try creating the tables
                    this._queryExec(SQL).then(res => {
                        // Check again to see if setup was successful
                        this._checkSetup().then(isSetUp => {
                            if (isSetUp){
                                // Resolve if setup was successful
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

    // Opens a database connection
    // Uses default option of creating database file if not present, and then opening in read/write mode
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

    // Runs a single query and resolves the result
    _queryAll(sql){
        return new Promise((resolve, reject) => {
            // Open a connection
            this._connect().then(db => {
                // Run the query
                db.all(sql, (err, res) => {
                    if (err){
                        reject(new Error(`${ERROR_PREFIX}._queryAll: failed to run query \n\t${err.message}`));
                    }
                    else{
                        // Resolve results if successful
                        resolve(res);
                    }
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}._queryAll: failed to connect to database \n\t${err.message}`));
            })
        })
    }

    // Runs multiple queries without checking the results
    _queryExec(sql){
        return new Promise((resolve, reject) => {
            // Open a connection
            this._connect().then(db => {
                // Run the queries
                db.exec(sql, err => {
                    if (err){
                        reject(new Error(`${ERROR_PREFIX}._queryExec: failed to run query \n\t${err.message}`));
                    }
                    else{
                        // Resolve nothing if nothing went wrong
                        resolve();
                    }
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}._queryExec: failed to connect to database \n\t${err.message}`));
            })
        })
    }

    // Adds a poll result to a plug
    // Takes the name of the plug and the values from the poll
    addPoll(name, timestamp_ms, runtime_s, power_w){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                // Check if plug exists
                this.checkPlugExistsByName(name).then(exists => {
                    let promises = [];
                    
                    // If plug doesn't exist, create one in the database
                    if (!exists){
                        promises.push(this.insertPlug(name));
                    }

                    // Wait for the insert promise to finish
                    Promise.all(promises).then(() => {
                        // Get the plug
                        this.selectPlugByName(name).then(plug => {
                            // Get the id of the plug in question
                            let plug_id = plug[0].plug_id;
                            // Insert poll into database
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

    // Checks if a plug exists in the database
    checkPlugExistsByName(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                // Get plugs matching the name
                this.selectPlugByName(name).then(res => {
                    // Check if a plug is in the list
                    resolve(res.length > 0);
                }).catch(err => {
                    reject(new Error(`${ERROR_PREFIX}.checkPlugExistsByName: failed to get plug \n\t${err.message}`));
                })
            }).catch(err => {
                reject(new Error(`${ERROR_PREFIX}.checkPlugExistsByName: failed to setup database \n\t${err.message}`));
            })
        })
    }

    // Insert a plug into the database
    insertPlug(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                // Run the insert query
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

    // Insert poll into database
    insertPoll(plug_id, timestamp_ms, runtime_s, power_w){
        return new Promise((resolve, reject) => {
            // Query to insert poll
            const SQL = `
                INSERT INTO poll(
                    plug_id, timestamp_ms, runtime_s, power_w
                ) VALUES(
                    ${plug_id}, ${timestamp_ms}, ${runtime_s}, ${power_w}
                );
            `

            this._setupIfNeeded().then(() => {
                // Run query
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

    // Gets a plug from the database using its name
    selectPlugByName(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                // Run select query using the name
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

    // Gets a list of all polls for a plug
    selectPollsByPlugName(name){
        return new Promise((resolve, reject) => {
            this._setupIfNeeded().then(() => {
                // Run select query
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
