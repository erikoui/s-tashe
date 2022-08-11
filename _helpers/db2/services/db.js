const mysql = require('mysql2/promise');
const config = require('../config');
const pool = mysql.createPool(config.db);

/**
 * executes sql query
 * @param {string} sql - sql string, use ? as placeholder for params
 * @param {array} params - array of parameter values
 * @return {object} data from the query
 */
async function query(sql, params) {
  // eslint-disable-next-line no-unused-vars
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
}

module.exports = {
  query,
};
