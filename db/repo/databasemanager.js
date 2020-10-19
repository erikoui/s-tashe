/**
 *  @fileOverview Definition for functions of db.databasemanager
 *
 *  @author       erikoui
 *
 *  @requires     ../sql
 */

/**
  *
  * @module db
  */
const {databasemanager: sql} = require('../sql');

/**
 * Provides functions to run sql queries regarding the database
 * as a whole.
 * @class
 */
class DatabaseManager {
  /**
   * Saves the database object to this.db
   * @param {*} db - database object (from db base module)
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * Creates the database as defined in sql/databasemanager/createdb.sql
   */
  async create() {
    return this.db.none(sql.createdb);
  }
}

module.exports = DatabaseManager;
