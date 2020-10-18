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

    //adds a tag to an image by making a record in this table
    async tagImage(picid,tagid){
        return this.db.any('INSERT INTO picture_tag(tag_id,pic_id) VALUES (${tag_id},${pic_id})',{
            tag_id:tagid,
            pic_id:picid
        })
    }
}

module.exports = PicTagsRepository;
