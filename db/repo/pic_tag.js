// Manages the picture_tag table
/**
 *
 * @module db
 */

/**
  *  Manages the picture_tag table.
  * All the functions in the class are promises (from async) so you
  * can call them with db.picTags.function(args).then(()=>{}).catch(()=>{}),
  * or you can await them in async functions
  * @class
  */
class PicTagsRepository {
  /**
   * @constructor
   * @param {*} db - the database object
   * @param {*} pgp - probably unnescessary, check it out
   */
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;
  }

  /**
   * Returns all picture_tag records
   */
  async all() {
    return this.db.any('SELECT * FROM picture_tag');
  }

  /**
   * Adds a tag to an image by making a record in this table
   * @param {int} picid - Picture id in pictures table
   * @param {int} tagid - Tag id in tags table
   */
  async tagImage(picid, tagid) {
    return this.db.any(
        'INSERT INTO picture_tag(tag_id,pic_id) VALUES (${tag_id},${pic_id})', {
          tag_id: tagid,
          pic_id: picid,
        });
  }
}

module.exports = PicTagsRepository;
