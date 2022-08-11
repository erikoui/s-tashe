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
class Reports {
  /** [UNTESTED]
   * Adds a report to the reports table
   * @param {string} rtype - report type (from declutter.reportTypes)
   * @param {string} details - details if entered
   * @param {int} picid - picture id
   * @param {int} reportedbyid - user id
   * @param {string} reportedbyuname - user name
   * @param {string} suggestedfix - suggestion if entered
   */
  async add(
      rtype,
      details,
      picid,
      reportedbyid,
      reportedbyuname,
      suggestedfix,
  ) {
    return db.query(
        `INSERT INTO reports(
        rtype,
        details,
        picid,
        reportedbyid,
        reportedbyuname,
        suggestedfix) 
        VALUES(?,?,?,?,?,?);`,
        [rtype, details, picid, reportedbyid, reportedbyuname, suggestedfix],
    );
  }

  /** [UNTESTED]
   * Returns all report records
   */
  async all() {
    return db.query('SELECT * FROM reports');
  }

  /** [UNTESTED]
   * deletes reports
   * @param {int} picid - picture id
   */
  async deleteByPicId(picid) {
    return db.query('DELETE FROM reports WHERE picid=?;', [picid]);
  }

  /** [UNTESTED]
   * returns all reports of a picture
   * @param {int} picid - picture id
   */
  async getByPicId(picid) {
    return db.query('SELECT * FROM reports WHERE picid=?;', [picid]);
  }
}


module.exports = Reports;
