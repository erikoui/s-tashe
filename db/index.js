const { Client } = require('pg')
const promise = require('bluebird'); // best promise library today
const pgPromise = require('pg-promise'); // pg-promise core library
const { Users, Pictures, Tags, PicTags, DatabaseManager } = require('./repo');


const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  ssl: {
    rejectUnauthorized: false
  }
};

// pg-promise initialization options:
const initOptions = {
  // Use a custom promise library, instead of the default ES6 Promise:
  promiseLib: promise,
  // Extending the database protocol with our custom repositories;
  // API: http://vitaly-t.github.io/pg-promise/global.html#event:extend
  extend(obj, dc) {
    // Database Context (dc) is mainly useful when extending multiple databases with different access API-s.

    // Do not use 'require()' here, because this event occurs for every task and transaction being executed,
    // which should be as fast as possible.
    obj.users = new Users(obj, pgp);
    obj.pictures = new Pictures(obj, pgp);
    obj.tags = new Tags(obj,pgp);
    obj.picTags = new PicTags(obj,pgp);
    obj.databaseManager = new DatabaseManager(obj,pgp);
  }
};


// Initializing the library:
const pgp = pgPromise(initOptions);

// Creating the database instance:
const db = pgp(dbConfig);

// Alternatively, you can get access to pgp via db.$config.pgp
// See: https://vitaly-t.github.io/pg-promise/Database.html#$config
module.exports = { db, pgp };
