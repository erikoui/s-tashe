// load pictures sql files but call it sql because we're cool like that
const {pictures: sql} = require('../sql');

/**
 * @module db
 */

/**
  * Manages the pictures table
  * All the functions in the class are promises (from async) so you
  * can call them with db.pictures.function(args).then(()=>{}).catch(()=>{}),
  * or you can await them in async functions. It does not use tempalte strings
  * for queries for security.
  * @class
  */
class PicturesRepository {
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
   *  Adds a new record and returns the full object
   * @param {string} desc - Description field
   * @param {string} fname - The filename on the cloud (the key).
   * @param {array<string>} tags - array of tags
   */
  async add(desc, fname, tags) {
    return this.db.one(sql.add, {
      description: desc,
      filename: fname,
      tags: tags,
    });
  }

  /**
   * Deletes a picture record by id. note that this does not
   * delete the file from the cloud server.
   * @param {int} id - The id of the record to delete.
   */
  async remove(id) {
    // TODO: delete picture by filename
    // return this.db.result(
    //   'DELETE FROM pictures WHERE id = $1', +id, r => r.rowCount
    // );
    console.log('pictures.js remove not yet implemented');
    return 0;
  }

  /**
   * Returns 2 pictures at random
   */
  async twoRandomPics() {
    const picData=await this.db.many(
        `SELECT p.id,p.filename,p.tags
        FROM pictures p
        ORDER BY RANDOM() 
        LIMIT 2;`,
    );
    const r=[
      {
        id: picData[0].id,
        filename: picData[0].filename,
        tags: picData[0].tags,
      },
      {
        id: picData[1].id,
        filename: picData[1].filename,
        tags: picData[1].tags,
      },
    ];
    return r;
  }

  /**
   * Tries to find a picture from picture filename.
   * If it doesnt find it, the promise will go to `.catch((rej) => {...})`
   * @param {string} fname - the filename on the cloud
   */
  async findByFilename(fname) {
    return this.db.one(
        'SELECT * FROM pictures WHERE filename = ${filename}', {
          filename: fname,
        });
  }

  /**
   * Tries to find many pics from picture description.
   * If it doesnt find it, the promise will go to `.catch((rej) => {...})`
   * @param {string} desc - some description as in the database.
   */
  async findByDescription(desc) {
    return this.db.many(
        'SELECT * FROM pictures WHERE description = ${description}',
        {description: desc},
    );
  }

  /**
   * Tries to find many pics from a single tag
   * @param {array<string>} tag - some description as in the database.
   */
  async listByTag(tag) {
    return this.db.any(
        'SELECT filename FROM pictures WHERE ${tag} = ANY (tags);',
        {tag: tag},
    );
  }

  /**
   * Increments the votes of a pic and the views of both pics
   * @param {int} voteid - image id to vote
   * @param {int} otherid - image id to increase views
   */
  async vote(voteid, otherid) {
    const voted = await this.db.one(
        // eslint-disable-next-line max-len
        'UPDATE pictures SET votes=votes+1, views=views+1 WHERE id=${picid} RETURNING *;',
        {picid: voteid},
    );
    if (!voted) {
      return {pic1votes: -1, pic1views: -1, pic2votes: -1, pic2views: -1};
    }
    const other=await this.db.one(
        'UPDATE pictures SET views=views+1 WHERE id=${picid} RETURNING *;',
        {picid: otherid},
    );
    return {pic1votes: voted.votes, pic1views: voted.views,
      pic2votes: other.votes, pic2views: other.views};
  }

  /**
   * returns the top n pics
   * @param {int} n Number of pics
   */
  async topN(n) {
    return this.db.many(
        // eslint-disable-next-line max-len
        'SELECT * FROM public.pictures ORDER BY votes DESC, views ASC LIMIT ${l};',
        {l: n},
    );
  }
  /**
   * Returns all picture records
   */
  async all() {
    return this.db.any('SELECT * FROM pictures');
  }

  /**
   * Returns the total number of pictures
   */
  async total() {
    return this.db.one('SELECT count(*) FROM pictures', [], (a) => +a.count);
  }
}

module.exports = PicturesRepository;
