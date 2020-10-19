/**
 *
 * @module db
 */

/**
 * Manages the tags table
 * All the functions in the class are promises (from async) so you
 * can call them with db.tags.function(args).then(()=>{}).catch(()=>{}),
 * or you can await them in async functions
 * @class
 */
class TagsRepository {
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
   * Returns all tag records;
   */
  async all() {
    return this.db.any('SELECT * FROM tags');
  }
}


module.exports = TagsRepository;
