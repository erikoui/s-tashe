const db = require('../services/db');

/**
 *
 * @module db
 */

/**
  * Manages the users table
  * All the functions in the class are promises (from async) so you
  * can call them with db.users.function(args).then(()=>{}).catch(()=>{}),
  * or you can await them in async functions
  * @class
  */
class UsersRepository {
  /** [UNTESTED]
   * Adds a new user, and returns the new object;
   * @param {String} uname - new username
   * @param {String} passwd - new password sha1 encoded
   */
  async add(uname, passwd) {
    return db.query(
        `INSERT INTO users(uname,points,password,deleted,admin)
        VALUES(?,0,?,false,false);`,
        [uname, passwd]);
  }

  /** [UNTESTED]
   * Tries to delete a user by id
   * @param {int} id - user id
   * @return {int} the number of records deleted
   */
  async remove(id) {
    return db.query(
        `DELETE FROM users 
        WHERE id = ?`,
        [id]);
  }

  /** [UNTESTED]
   * changes the selected tag id for the current user
   * @param {int} userId -
   * @param {int} tagId -
   */
  async changeTagId(userId, tagId) {
    return db.query(
        `UPDATE users 
        SET selectedtag=?
        WHERE id=?;`,
        [tagId, userId],
    );
  }

  /** [UNTESTED]
   *
   * @param {int} userId asdasd
   * @param {string} newUsername new username
   */
  async changeUsername(userId, newUsername) {
    return db.query(
        `UPDATE users 
        SET uname=?
        WHERE id=?;`,
        [newUsername, userId]);
  }

  /** [UNTESTED]
   *
   * @param {int} userId asdasd
   * @param {string} oldPass old pass
   * @param {string} newPass new pass
   */
  async changePassword(userId, oldPass, newPass) {
    return db.query(
        `UPDATE users 
        SET password=?
        WHERE id=? AND password=?;`,
        [newPass, userId, oldPass]);
  }

  /** [UNTESTED]
   * Tries to find a user by id
   * @param {int} id - user id
   */
  async findById(id) {
    return db.query('SELECT * FROM users WHERE id = ?', [id]);
  }

  /** [UNTESTED]
   * Tries to find a user by name
   * @param {String} uname - The user name
   */
  async findByName(uname) {
    return db.query('SELECT * FROM users WHERE uname = ?', [uname]);
  }

  /** [UNTESTED]
   * Tries to find a user by name and password
   * @param {String} uname - The user name
   * @param {String} password - the SHA1 hashed password
   */
  async login(uname, password) {
    return db.query(
        'SELECT * FROM users WHERE uname = ? AND password=?',
        [uname, password]);
  }

  /** [UNTESTED]
   * increases a user's points.
   * @param {int} id - user id
   * @param {int} points - points to add (can be negative)
   */
  async addPoints(id, points) {
    return db.query(
        `UPDATE users 
        SET points=points+?
        WHERE id=?;`,
        [points, id]);
  }

  /**
   * Returns all user records
   */
  async all() {
    return db.query('SELECT * FROM users');
  }

  /**
   * Returns the total number of users
   */
  async total() {
    return db.query('SELECT count(*) FROM users');
  }
}

module.exports = UsersRepository;
