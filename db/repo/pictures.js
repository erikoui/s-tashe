// Manages the pictures table

// All the functions in the class are promises (from async) so you 
// can call them with db.pictures.function(args).then(()=>{}).catch(()=>{}),
// or you can await them in async functions

// load pictures.js but call it sql because we're cool like that
const {pictures: sql} = require('../sql');

class PicturesRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;
    }

    // Adds a new record and returns the full object
    async add(desc,fname) {
        return this.db.one(sql.add, {
            description: desc,
            filename: fname
        });
    }

    // TODO: Tries to delete a picture by id, and returns the number of records deleted;
    // TODO: delete picture by filename
    async remove(id) {
        //return this.db.result('DELETE FROM pictures WHERE id = $1', +id, r => r.rowCount);
        console.log("pictures.js remove not yet implemented")
        return 0;
    }

    // Returns 2 pictures at random
    async twoRandomPics(){
        return this.db.many('SELECT * FROM pictures ORDER BY RANDOM() LIMIT 2;');
    }

    // Tries to find a picture from picture filename;
    // if it doesnt find it, the promise will go to .catch((rej) => {...})
    async findByFilename(fname) {
        return this.db.one('SELECT * FROM pictures WHERE filename = ${filename}',{
            filename : fname
        });
    }

    // Tries to find many pics from picture description;
    // if it doesnt find it, the promise will go to .catch((rej) => {...})
    async findByDescription(desc) {
        return this.db.many('SELECT * FROM pictures WHERE description = ${description}',{
            description : desc
        });
    }

    // Returns all picture records;
    async all() {
        return this.db.any('SELECT * FROM pictures');
    }

    // Returns the total number of pictures;
    async total() {
        return this.db.one('SELECT count(*) FROM pictures', [], a => +a.count);
    }
}

module.exports = PicturesRepository;
