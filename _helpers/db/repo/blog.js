/**
 *
 * @module db
 */

/**
 * Manages the tags table
 * All the functions in the class are promises (from async) so you
 * can call them with db.tags.function(args).then(()=>{}).catch(()=>{}),
 * or you can await them in async functions
 * @class
 */
class BlogRepository {
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
     * Returns all blog records;
     */
  async all() {
    return this.db.many('SELECT * FROM blog');
  }

  /**
   * Gets the most recent N number of blog posts (without content)
   *
   * @param {inte} n - number of records
   */
  async getRecentN(n) {
    return this.db.many(
        // eslint-disable-next-line max-len
        'SELECT b.id,b.title,b.abstract,b.filename,b.date FROM blog b ORDER BY b.date LIMIT ${n};',
        {
          n: n,
        },
    );
  }

  /**
   * Gets the most recent N number of blog posts (without content)
   *
   * @param {inte} id - blogpost id
   */
  async getBlogPost(id) {
    return this.db.one(
        // eslint-disable-next-line max-len
        'SELECT * FROM blog b WHERE b.id=${id};',
        {
          id: id,
        },
    );
  }
}


module.exports = BlogRepository;

