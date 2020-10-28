const {QueryFile} = require('pg-promise');
const {join: joinPath} = require('path');

/**
 * @module db
 */
module.exports = {
  // Possible alternative - enumerating all SQL files automatically:
  // http://vitaly-t.github.io/pg-promise/utils.html#.enumSql

  // add query files as member functions here
  users: {
    add: sql('users/add.sql'),
  },
  pictures: {
    add: sql('pictures/add.sql'),
  },
};

/**
 * Helper for linking to external query files.
 * @param {String} file - the relative filepath of the sql file
 *
 * @return {QueryFile} qf - See QueryFile API:
 * http://vitaly-t.github.io/pg-promise/QueryFile.html
 */
function sql(file) {
  const fullPath = joinPath(__dirname, file); // generating full path

  const options = {
    minify: true,
  };

  const qf = new QueryFile(fullPath, options);

  if (qf.error) {
    // Something is wrong with our query file :(
    // Testing all files through queries can be cumbersome,
    // so we also report it here, while loading the module:
    console.error(qf.error);
  }

  return qf;
}
