const env = process.env;

const config = {
  db: {/* do not put password or any sensitive info here, done only for demo */
    password: env.DB_PASSWORD,
    user: env.DB_USER,
    database: env.DB_NAME,
    host: env.DB_HOST,
    waitForConnections: true,
    connectionLimit: env.DB_CONN_LIMIT,
    queueLimit: 0,
    debug: env.DB_DEBUG || false,
  },
};

module.exports = config;
