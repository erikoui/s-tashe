//Manages the picture_tag table

class PicTagsRepository {
    constructor(db, pgp) {
        this.db = db;
        this.pgp = pgp;
    }

    // Returns all picture_tag records;
    async all() {
        return this.db.any('SELECT * FROM picture_tag');
    }
}

module.exports = PicTagsRepository;
