const db = require('../services/db');

/**
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
   * Returns all tag records;
   */
  async all() {
    return db.query('SELECT * FROM tags');
  }

  /**
   * Returns tags with downolad enabled and their aliases
   */
  async downloadTagListAndAlias() {
    return db.query(
        `SELECT t.tag, a.alias
        FROM tags t
        INNER JOIN tag_aliases a
        ON t.id=a.fk_tagid
        WHERE t.auto_download=true;`);
  }
}

module.exports = TagsRepository;
