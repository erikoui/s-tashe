const db = require('../services/db');

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
  /** [UNTESTED]
   *  Adds a new record and returns the full object
   * @param {string} desc - Description field
   * @param {string} fname - The filename on the cloud (the key).
   * @param {array<string>} tags - array of tags
   */
  async add(desc, fname, tags) {
    return db.query(
        `INSERT INTO pictures(description, filename, tags)
        VALUES(?, ?, ?) 
        RETURNING *`,
        [desc, fname, tags]);
  }

  /** [UNTESTED]
   * adds a tag to the picture tag array
   * @param {int} picid -
   * @param {string} tag -
   */
  async addTag(picid, tag) {
    return db.query(
        `INSERT INTO pic_tag (fk_picid,fk_tagid)
        VALUES (?, (SELECT id FROM tags WHERE tag=?))
        RETURNING *;`,
        [picid, tag]);
  }

  /** [UNTESTED]
   * removes a tag to the picture tag array
   * @param {int} picid -
   * @param {string} tag -
   */
  async removeTag(picid, tag) {
    return db.query(
        `DELETE FROM pic_tag 
        WHERE fk_picid=? AND fk_tagid=(SELECT id FROM tags WHERE tag=?)`,
        [picid, tag]);
  }
  /** [UNTESTED]
   * returns the tags of a picture by id
   * @param {int} picid pic id
   */
  async getPicDataById(picid) {
    return db.query(
        `SELECT * 
        FROM pictures p 
        WHERE p.id=$?`,
        [picid]);
  }

  /** [UNTESTED]
   * Changes the description of a picture by id
   * @param {int} picid -picture id
   * @param {string} newDesc -new desctription
   */
  async changeDesc(picid, newDesc) {
    await db.query(
        `UPDATE pictures p 
        SET description=? 
        WHERE p.id=?`,
        [newDesc, picid]);
    return db.query(
        `SELECT description
        FROM pictures
        WHERE id=?`,
        [picid]);
  }

  /** [UNTESTED]
   * Deletes a picture record by id. note that this does not
   * delete the file from the cloud server.
   * @param {int} id - The id of the record to delete.
   *
   * @return {object} - object.filename has the fn of the deleted file
   */
  async deleteById(id) {
    const fn=await db.query(
        `SELECT filename
        FROM pictures
        WHERE id=?`,
        [id]);
    await db.query(
        `DELETE FROM pictures 
        WHERE id = ?`,
        [id]);
    return fn;
  }

  /**
   * Returns 2 pictures at random
   * @param {int} selectedtag - The tag id that the current user has selected.
   */
  async twoRandomPics(selectedtag) {
    const pics=await db.query(
        `SELECT p.id,p.filename,p.description,p.votes,p.views
        FROM pictures p
        INNER JOIN pic_tag pt
        ON p.id=pt.fk_picid
        INNER JOIN tags t
        ON pt.fk_tagid=t.id
        WHERE t.id=?
        ORDER BY RAND()
        LIMIT 2;`,
        [selectedtag]);
    const p1tags=await db.query(
        `SELECT t.tag
        FROM tags t
        INNER JOIN pic_tag pt
        ON t.id=pt.fk_tagid
        INNER JOIN pictures p
        ON pt.fk_picid=p.id
        WHERE p.id=?`,
        [pics[0].id]);
    const p2tags=await db.query(
        `SELECT t.tag
          FROM tags t
          INNER JOIN pic_tag pt
          ON t.id=pt.fk_tagid
          INNER JOIN pictures p
          ON pt.fk_picid=p.id
          WHERE p.id=?`,
        [pics[1].id]);

    // convert tag objects to arrays of strings
    const flat1=[];
    p1tags.forEach((x)=>{
      flat1.push(x.tag);
    });
    const flat2=[];
    p2tags.forEach((x)=>{
      flat2.push(x.tag);
    });

    return {pics: pics, t1: flat1, t2: flat2};
  }

  /** [UNTESTED]
   * Tries to find a picture from picture filename.
   * If it doesnt find it, the promise will go to `.catch((rej) => {...})`
   * @param {string} fname - the filename on the cloud
   */
  async findByFilename(fname) {
    return db.query(
        `SELECT * 
        FROM pictures 
        WHERE filename = ?`,
        [fname]);
  }

  /** [UNTESTED]
   * Tries to find many pics from picture description.
   * If it doesnt find it, the promise will go to `.catch((rej) => {...})`
   * @param {string} desc - some description as in the database.
   */
  async findByDescription(desc) {
    return db.query(
        `SELECT * 
        FROM pictures 
        WHERE description = ?`,
        [desc]);
  }

  /** [MUST BE REMADE]
   * deletes
   *    * duplicate picture records,
   *    * records with no matching file on the cloud,
   *    * records with tags not in the tag table.
   * @param {array} cloudfiles - array of filenames of all files on the cloud
   */
  async cleanup(cloudfiles) {
  }

  /** [UNTESTED]
   * Finds many pics from a single tag
   * @param {string} tag - name of tag
   * @param {int} minviews - minmimum views to be shown as sorted
   * @param {int} offset - how many items to skip
   * @param {int} imagesPerPage - how many items to return
   */
  async listByTagName(tag, minviews, offset, imagesPerPage) {
    return [
      db.query(
          `SELECT *, (votes+1) / (views+1) AS score 
          FROM pictures p
          INNER JOIN pic_tag pt
          ON p.id=pt.fk_picid
          INNER JOIN tags t
          ON pt.fk_tagid=t.id
          WHERE t.tag=?
          ORDER BY CASE WHEN views >= ? THEN 0 ELSE 1 END, score DESC
          LIMIT ? OFFSET ?;`,
          [tag, minviews, imagesPerPage, offset]),
      db.query(
          `SELECT COUNT (*) 
          FROM pictures p
          INNER JOIN pic_tag pt
          ON p.id=pt.fk_picid
          INNER JOIN tags t
          ON pt.fk_tagid=t.id
          WHERE t.tag=?`,
          [tag]),
    ];
  }

  /** [UNTESTED]
   * Tries to find many pics from a tag id
   * @param {int} tagId - tag id
   */
  async getAllByTagId(tagId) {
    return db.query(
        `SELECT * 
        FROM pictures p
        INNER JOIN pic_tag pt
        ON p.id=pt.fk_picid
        INNER JOIN tags t
        ON pt.fk_tagid=t.id
        WHERE t.id=?`,
        [tagId]);
  }

  /**
   * Increments the votes of a pic and the views of both pics
   * @param {int} voteid - image id to vote
   * @param {int} otherid - image id to increase views
   */
  async vote(voteid, otherid) {
    await db.query(
        `UPDATE pictures 
        SET votes=votes+1, views=views+1 
        WHERE id=?;`,
        [voteid]);
    const voted = await db.query(
        `SELECT *
        FROM pictures
        WHERE id=?`,
        [voteid]);

    if (!voted) {
      return {pic1votes: -1, pic1views: -1, pic2votes: -1, pic2views: -1};
    }

    await db.query(
        `UPDATE pictures 
        SET views=views+1 
        WHERE id=?;`,
        [otherid]);
    const other = await db.query(
        `SELECT *
        FROM pictures
        WHERE id=?`,
        [otherid]);
    return {
      pic1votes: voted.votes, pic1views: voted.views,
      pic2votes: other.votes, pic2views: other.views,
    };
  }

  /** [UNTESTED]
   * returns the top n pics
   * @param {int} n Number of pics
   * @param {int} minviews - minmimum views to be shown as sorted
   */
  async topN(n, minviews) {
    return db.query(
        `SELECT *, (votes+1) / (views+1) AS score 
        FROM pictures 
        ORDER BY CASE WHEN views >= ? THEN 0 ELSE 1 END, score DESC
        LIMIT ?;`,
        [minviews, n]);
  }

  /** [UNTESTED]
   * returns the top n pics by tag
   * @param {int} n Number of pics
   * @param {int} minviews - minmimum views to be shown as sorted
   * @param {string} tag - tag name
   */
  async topNandTag(n, minviews, tag) {
    return db.query(
        `SELECT *, (votes+1) / (views+1 ) AS score 
        FROM pictures p
        INNER JOIN pic_tag pt
        ON p.id=pt.fk_picid
        INNER JOIN tags t
        ON pt.fk_tagid=t.id
        WHERE t.tag=?
        ORDER BY CASE WHEN views >= ? THEN 0 ELSE 1 END, score DESC 
        LIMIT ?;`,
        [tag, minviews, n]);
  }

  /**
   * Returns all picture records
   */
  async all() {
    return db.query(
        `SELECT *
        FROM pictures 
        ORDER BY filename`);
  }
}

module.exports = PicturesRepository;
