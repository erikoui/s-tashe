// load users sql files but call it sql because we're cool like that
const {users: sql} = require('../sql');
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
   * Adds a new user, and returns the new object;
   * @param {String} uname - new username
   * @param {String} passwd - new password sha1 encoded
   */
  async add(uname, passwd) {
    return this.db.one(sql.add, {
      username: uname,
      password: passwd,
    });
  }

  /**
   * Tries to delete a user by id
   * @param {int} id - user id
   * @return {int} the number of records deleted
   */
  async remove(id) {
    return this.db.result(
        'DELETE FROM users WHERE id = $1', +id, (r) => r.rowCount,
    );
  }

  /**
   * changes the selected tag id for the current user
   * @param {int} userId -
   * @param {int} tagId -
   */
  async changeTagId(userId, tagId) {
    return this.db.none(
        'UPDATE users SET selectedtag=${newtag} WHERE id=${uid};', {
          newtag: tagId,
          uid: userId,
        },
    );
  }

  /**
   * asdasd
   * @param {int} userId asdasd
   * @param {string} newUsername new username
   */
  async changeUsername(userId, newUsername) {
    return this.db.none(
        'UPDATE users SET uname=${newname} WHERE id=${uid};', {
          newname: newUsername,
          uid: userId,
        },
    );
  }

  /**
   * asdasd
   * @param {int} userId asdasd
   * @param {string} oldPass old pass
   * @param {string} newPass new pass
   */
  async changePassword(userId, oldPass, newPass) {
    return this.db.one(
        // eslint-disable-next-line max-len
        'UPDATE users SET password=${newpass} WHERE id=${uid} AND password=${oldpass} RETURNING *;', {
          newpass: newPass,
          oldpass: oldPass,
          uid: userId,
        },
    );
  }

  /**
   * Tries to find a user by id
   * @param {int} id - user id
   */
  async findById(id) {
    return this.db.oneOrNone('SELECT * FROM users WHERE id = $1', +id);
  }

  /**
   * Tries to find a user by name
   * @param {String} uname - The user name
   */
  async findByName(uname) {
    return this.db.oneOrNone('SELECT * FROM users WHERE uname = $1', uname);
  }

  /**
   * Tries to find a user by name and password
   * @param {String} uname - The user name
   * @param {String} password - the SHA1 hashed password
   */
  async login(uname, password) {
    return this.db.oneOrNone(
        'SELECT * FROM users WHERE uname = ${username} AND password=${pass}',
        {
          username: uname, pass: password,
        });
  }

  /**
   * increases a user's points.
   * @param {int} id - user id
   * @param {int} points - points to add (can be negative)
   */
  async addPoints(id, points) {
    console.log(`adding ${points} points to ${id}`);
    // eslint-disable-next-line max-len
    return this.db.one('UPDATE users SET points=points+('+points+') WHERE id=${uid} RETURNING *;', {uid: id});
  }

  /**
   * Returns all user records
   */
  async all() {
    return this.db.any('SELECT * FROM users');
  }

  /**
   * Returns the total number of users
   */
  async total() {
    return this.db.one('SELECT count(*) FROM users', [], (a) => +a.count);
  }
}

module.exports = UsersRepository;
