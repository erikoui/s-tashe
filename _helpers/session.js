const session = require('express-session');
const mysql2 = require('mysql2/promise');
const MySQLStore = require('express-mysql-session')(session);
const config = require('./db2/config');

const connection = mysql2.createPool(config.db);
const sessionStore = new MySQLStore({}, connection);

module.exports=sessionStore;
