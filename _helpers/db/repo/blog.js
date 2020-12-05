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
        'SELECT b.id,b.title,b.abstract,b.filename,b.date FROM blog b ORDER BY "date" DESC LIMIT ${n};',
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

  /** deletes
   * @param {int} id - id
   */
  async deleteBlogPost(id) {
    return this.db.none(
        // eslint-disable-next-line max-len
        'DELETE FROM blog b WHERE b.id=${id};',
        {
          id: id,
        },
    );
  }

  /**
   * edits a post
   * @param {post} data - contains id,title,abstract and body
   */
  async editPost(data) {
    return this.db.none(
        // eslint-disable-next-line max-len
        'UPDATE blog SET title=${t}, abstract=${a}, body=${b}, filename=${f} WHERE id=${id}', {
          a: data.abstract,
          b: data.body,
          id: data.id,
          t: data.title,
          f: data.filename,
        },
    );
  }

  /**
   * adds a post
   * @param {post} data - same as editPost
   */
  async addPost(data) {
    return this.db.none(
        // eslint-disable-next-line max-len
        'INSERT INTO blog (title, abstract, body, date) VALUES (${t}, ${a}, ${b}, CURRENT_TIMESTAMP)', {
          a: data.abstract,
          b: data.body,
          t: data.title,
        },
    );
  }
}


module.exports = BlogRepository;

