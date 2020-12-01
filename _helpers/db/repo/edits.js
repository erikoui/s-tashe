/* eslint-disable camelcase */

/**
 * @module db
 */

/**
  * Manages the pictures table
  * All the functions in the class are promises (from async) so you
  * can call them with db.pictures.function(args).then(()=>{}).catch(()=>{}),
  * or you can await them in async functions. It does not use tempalte strings
  * for queries for security.
  * @class
  */
class Edits {
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
   * Adds a report to the reports table
   * @param {string} edit_type - report type (from declutter.reportTypes)
   * @param {int} user_id - picture id
   * @param {string} previous_data - user name
   * @param {int} pic_id - user id
   */
  async add(
      edit_type,
      user_id,
      previous_data,
      pic_id,
  ) {
    return this.db.any(
        'INSERT INTO edits(${this:name}) VALUES(${this:csv})',
        {
          edit_type: edit_type,
          user_id: user_id,
          previous_data: previous_data,
          pic_id: pic_id,
        },
    );
  }

  /**
   * Returns all edit records
   */
  async all() {
    return this.db.any('SELECT * FROM edits');
  }

  /**
   * returns all edits of a picture
   * @param {int} pic_id - picture id
   */
  async getByPicId(pic_id) {
    // eslint-disable-next-line max-len
    return this.db.any('SELECT * FROM edits WHERE pic_id=${id} ORDER BY date;', {
      id: pic_id,
    });
  }

  /**
   * returns all reports of a user
   * @param {int} user_id - picture id
   */
  async getByUid(user_id) {
    // eslint-disable-next-line max-len
    return this.db.any('SELECT * FROM edits WHERE user_id=${user_id} ORDER BY date;', {
      user_id: user_id,
    });
  }
}


module.exports = Edits;
