const {databasemanager: sql} = require('../sql');

class DatabaseManager{
    constructor(db,pgp){
        this.db = db;
        this.pgp = pgp;
    }

    async create(){
        return this.db.none(sql.createdb);
    }
}

module.exports = DatabaseManager;