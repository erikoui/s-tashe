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
   * @param {int} selectedtag - The tag id that the current user has selected.
   */
  async twoRandomPics(selectedtag) {
    const picData=await this.db.many(
        `SELECT p.id,p.filename,p.tags
        FROM pictures p
        WHERE (
          SELECT tag FROM tags WHERE id=${selectedtag} LIMIT 1
          ) = ANY (tags)
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
    return this.db.many(
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
   * cleans up table
   * deletes all
   * duplicate picture records,
   * records with no matching file on the cloud,
   * records with tags not in the tag table.
   *
   * @param {array} cloudfiles - array of filenames of all files on the cloud
   */
  async cleanup(cloudfiles) {
    // Duplicates
    try {
      const d=await this.db.any(
          `DELETE FROM pictures
WHERE id IN
(SELECT id
FROM 
(SELECT id,
ROW_NUMBER() OVER( PARTITION BY filename
ORDER BY  id DESC ) AS row_num
FROM pictures ) t
WHERE t.row_num > 1 )
RETURNING *;`,
      );
      console.log(`${d.length} rows deleted`);

      // records with no matching files on the cloud
      const qsstr=`DELETE FROM pictures AS m WHERE m.filename NOT IN (${JSON.stringify(cloudfiles).replace('[', '').replace(']', '').replace(/"/g, '\'')}) RETURNING *;`;
      console.log(qsstr);
      const c=await this.db.any(
          qsstr,
      );
      console.log(c.length+' files not on the cloud');
    } catch (e) {
      console.error(e);
    }
  }
  /**
   * Tries to find many pics from a single tag
   * @param {array<string>} tag - some description as in the database.
   * @param {int} minviews - minmimum views to be shown as sorted
   */
  async listByTag(tag, minviews) {
    return this.db.any(
        // eslint-disable-next-line max-len
        'SELECT *, CAST(votes+1 AS real) / CAST(views+1 AS real) AS score FROM pictures WHERE ${tag} = ANY (tags) ORDER BY CASE WHEN views >= '+minviews+' THEN 0 ELSE 1 END, score DESC;',
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
   * @param {int} minviews - minmimum views to be shown as sorted
   */
  async topN(n, minviews) {
    return this.db.many(
        // eslint-disable-next-line max-len
        'SELECT *, CAST(votes+1 AS real) / CAST(views+1 AS real) AS score FROM public.pictures ORDER BY CASE WHEN views >= ${m} THEN 0 ELSE 1 END, score DESC LIMIT ${l};',
        {
          m: minviews,
          l: n,
        },
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
