const promise = require('bluebird'); // best promise library today
const pgPromise = require('pg-promise'); // pg-promise core library
const {Users, Pictures, Tags, Reports, Blog, Edits} = require('./repo');


const dbConfig = {
  connectionString: process.env.DATABASE_URL_NOSSL,
  ssl: process.env.LOCAL ? true : false,
  ssl: {
    rejectUnauthorized: false,
  },
};

// pg-promise initialization options:
const initOptions = {
  // Use a custom promise library, instead of the default ES6 Promise:
  promiseLib: promise,
  // Extending the database protocol with our custom repositories;
  // API: http://vitaly-t.github.io/pg-promise/global.html#event:extend
  extend(obj, dc) {
    // Database Context (dc) is mainly useful when extending multiple databases
    // with different access API-s.

    // Do not use 'require()' here, because this event occurs for every task
    // and transaction being executed, which should be as fast as possible.
    obj.users = new Users(obj, pgp);
    obj.pictures = new Pictures(obj, pgp);
    obj.tags = new Tags(obj, pgp);
    obj.reports = new Reports(obj, pgp);
    obj.blog = new Blog(obj, pgp);
    obj.edits = new Edits(obj, pgp);
  },
};


// Initializing the library:
const pgp = pgPromise(initOptions);

// Creating the database instance:
const db = pgp(dbConfig);

// Alternatively, you can get access to pgp via db.$config.pgp
// See: https://vitaly-t.github.io/pg-promise/Database.html#$config
module.exports = {db, pgp};
