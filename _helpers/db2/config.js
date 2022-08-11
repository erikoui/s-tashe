const env = process.env;

const config = {
  db: {/* do not put password or any sensitive info here, done only for demo */
    password: env.DB_PASSWORD||'FuckMyLife69',
    user: env.DB_USER || 'u658055400_erikprojects',
    database: env.DB_NAME || 'u658055400_erikprojects',
    host: env.DB_HOST ||'2.57.89.103',
    waitForConnections: true,
    connectionLimit: env.DB_CONN_LIMIT || 2,
    queueLimit: 0,
    debug: env.DB_DEBUG || false,
  },
};

module.exports = config;
