const db = require('../services/db');

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
  /** [UNTESTED]
   * Adds a report to the reports table
   * @param {string} editType - report type (from declutter.reportTypes)
   * @param {int} userId - picture id
   * @param {string} prevData - user name
   * @param {int} picId - user id
   */
  async add(
      editType,
      userId,
      prevData,
      picId,
  ) {
    return db.query(
        `INSERT INTO edits(
          edit_type,
          user_id,
          previous_data,
          pic_id)
          VALUES(?,?,?,?);`,
        [editType, userId, prevData, picId]);
  }

  /** [UNTESTED]
   * Returns all edit records
   */
  async all() {
    return db.query('SELECT * FROM edits');
  }

  /** [UNTESTED]
   * returns all edits of a picture
   * @param {int} picId - picture id
   */
  async getByPicId(picId) {
    // eslint-disable-next-line max-len
    return db.query(
        `SELECT edits.date, edits.edit_type, users.uname, edits.previous_data 
        FROM edits 
        INNER JOIN users 
        ON edits.user_id=users.id 
        WHERE pic_id=?
        ORDER BY date;`,
        [picId]);
  }

  /** [UNTESTED]
   * returns all reports of a user
   * @param {int} userId - picture id
   */
  async getByUid(userId) {
    // eslint-disable-next-line max-len
    return db.query(
        `SELECT * 
        FROM edits 
        WHERE user_id=? 
        ORDER BY date;`,
        [userId]);
  }
}


module.exports = Edits;
