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
   */
  async add(desc, fname) {
    return this.db.one(sql.add, {
      description: desc,
      filename: fname,
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
    // TODO: single SQL statement for this mess

    const picData=await this.db.many(
        'SELECT p.id,p.filename FROM pictures p ORDER BY RANDOM() LIMIT 2;',
    );

    const tagData1=await this.db.many(
        'SELECT t.tag_id FROM picture_tag t WHERE t.pic_id=${picid}', {
          picid: picData[0].id,
        },
    );
    const tagData2=await this.db.many(
        'SELECT t.tag_id FROM picture_tag t WHERE t.pic_id=${picid}', {
          picid: picData[1].id,
        },
    );

    const tagNames1=[];
    const tagids1=[];
    for (let i=0; i<tagData1.length; i++) {
      const tag=await this.db.one(
          'SELECT t.tag FROM tags t WHERE t.id=${tagid}', {
            tagid: tagData1[i].tag_id,
          },
      );
      tagNames1.push(tag.tag);
      tagids1.push(tagData1[i].tag_id);
    }

    const tagNames2=[];
    const tagids2=[];
    for (let i=0; i<tagData2.length; i++) {
      const tag=await this.db.one(
          'SELECT t.tag FROM tags t WHERE t.id=${tagid}', {
            tagid: tagData2[i].tag_id,
          },
      );
      tagNames2.push(tag.tag);
      tagids2.push(tagData2[i].tag_id);
    }

    const r=[
      {
        id: picData[0].id,
        filename: picData[0].filename,
        tags: tagNames1,
        tagids: tagids1,
      },
      {
        id: picData[1].id,
        filename: picData[1].filename,
        tags: tagNames2,
        tagids: tagids2,
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
   * Tries to find many pics from tag id list. This is an AND type query.
   * @param {array<int>} tagids - some description as in the database.
   */
  async findByTag(tagids) {
    // TODO: test this function
    let tagstring='';
    for (let i=0; i<tagids.length-1; i++) {
      tagstring+=tagids[i];
    }
    tagstring+=tagids[tagids.length-1];

    const q=`SELECT b.*
      FROM picture_tag bt, pictures b, tags t
      WHERE bt.tag_id = t.id
      AND (t.id IN (${tagstring})
      AND b.id = bt.pic_id
      GROUP BY b.id
      HAVING COUNT( b.id )=${tagids.length};`;
    console.log(q);
    return this.db.any(q);
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
