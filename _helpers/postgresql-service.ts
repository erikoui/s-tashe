
const { Pool, Client } = require('pg');

const pgSession = require('connect-pg-simple');

module.exports = class PostgresqlService {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL_NOSSL,
    //ssl: process.env.LOCAL ? true : false,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  sessionHandler(session) {
    const pgs = pgSession(session);
    return new pgs({
      conString: process.env.DATABASE_URL_NOSSL,
      pool: this.pool,
      schemaName: 'public',
      tableName: 'session',
    });
  }
}