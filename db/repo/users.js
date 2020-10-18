// TODO: I just copied this, adapt for use with our db

// To use this functions, use `const { db } = require('./db');` at the start of your file
// All the functions in the class are promises (from async) so you
// can call them with `db.users.function(args).then(()=>{}).catch(()=>{})`,
// or you can await them in async functions

// add queries here similar to findByName, no need to add more sql files

const {users: sql} = require('../sql');

const cs = {}; // Reusable ColumnSet objects.

/*
 This repository mixes hard-coded and dynamic SQL, primarily to show a diverse example of using both.
 */

class UsersRepository {
  constructor(db, pgp) {
    this.db = db;
    this.pgp = pgp;

    // set-up all ColumnSet objects, if needed:
    createColumnsets(pgp);
  }

  // Adds a new user, and returns the new object;
  async add(uname, passwd) {
    return this.db.one(sql.add, {
      username: uname,
      password: passwd,
    });
  }

  // Tries to delete a user by id, and returns the number of records deleted;
  async remove(id) {
    return this.db.result('DELETE FROM users WHERE id = $1', +id, (r) => r.rowCount);
  }

  // Tries to find a user from id;
  async findById(id) {
    return this.db.oneOrNone('SELECT * FROM users WHERE id = $1', +id);
  }

  // Tries to find a user from name;
  async findByName(name) {
    return this.db.oneOrNone('SELECT * FROM users WHERE uname = $1', name);
  }

  // Returns all user records;
  async all() {
    return this.db.any('SELECT * FROM users');
  }

  // Returns the total number of users;
  async total() {
    return this.db.one('SELECT count(*) FROM users', [], (a) => +a.count);
  }
}

// ////////////////////////////////////////////////////////
// Example of statically initializing ColumnSet objects:

function createColumnsets(pgp) {
  // create all ColumnSet objects only once:
  if (!cs.insert) {
    // Type TableName is useful when schema isn't default "public" ,
    // otherwise you can just pass in a string for the table name.
    const table = new pgp.helpers.TableName({table: 'users', schema: 'public'});

    cs.insert = new pgp.helpers.ColumnSet(['uname'], {table});
    cs.update = cs.insert.extend(['?id']);
  }
  return cs;
}

module.exports = UsersRepository;
