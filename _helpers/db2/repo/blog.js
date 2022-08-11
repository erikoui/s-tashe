const db = require('../services/db');
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
     * Returns all blog records;
     */
  async all() {
    return db.query('SELECT * FROM blog');
  }

  /** [UNTESTED]
   * Gets the most recent N number of blog posts (without content)
   *
   * @param {inte} n - number of records
   */
  async getRecentN(n) {
    return db.query(
        `SELECT b.id,b.title,b.abstract,b.filename,b.date 
        FROM blog b ORDER BY "date" DESC LIMIT ?;`,
        [n]);
  }

  /** [UNTESTED]
   * Gets the most recent N number of blog posts (without content)
   *
   * @param {inte} id - blogpost id
   */
  async getBlogPost(id) {
    return db.query(
        'SELECT * FROM blog b WHERE b.id=?;',
        [id],
    );
  }

  /** [UNTESTED]
   *  deletes
   * @param {int} id - id
   */
  async deleteBlogPost(id) {
    return db.query(
        'DELETE FROM blog b WHERE b.id=?;',
        [id]);
  }

  /** [UNTESTED]
   * edits a post
   * @param {post} data - contains id,title,abstract and body
   */
  async editPost(data) {
    return db.query(
        'UPDATE blog SET title=?, abstract=?, body=?, filename=? WHERE id=?',
        [data.title, data.abstract, data.body, data.filename, data.id]);
  }

  /** [UNTESTED]
   * adds a post
   * @param {post} data - same as editPost
   */
  async addPost(data) {
    return db.query(
        `INSERT INTO blog (title, abstract, body, date) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [data.title, data.body, data.abstract] );
  }
}


module.exports = BlogRepository;

