const md5File = require('md5-file');
const path = require('path');
const fs = require('fs');

/**
 * @module Declutter
 */

/**
 * Some helper functions to make index.js smaller
 * @class
 */
class Declutter {
  /**
   * @constructor
   *
   * @param {db} database - the db object in index.js
   * @param {Cloud} cloudStorage - the cloud object in index.js
   */
  constructor(database, cloudStorage) {
    this.db = database;
    this.cloud = cloudStorage;
    this.votePointIncrement = 1;
    this.rankingData = {
      ranks: ['newfag', 'pleb', 'rookie', 'new recruit',
        'experienced', 'veteran', 'coomer', 'wizard'],
      pointBreaks: [20, 100, 250, 500, 1000, 2000, 5000, 1000000],
      levels: [0, 1, 2, 3, 4, 5, 6, 7],
    };
    this.tags=this.refreshTags();
    console.log('Declutter loaded');
  }

  /**
   * Converts the users points to a text description
   * @param {any} user - the user object returned by login
   *
   * @return {Object} the user rank
   */
  makeRank(user) {
    if (user.admin) {
      return {level: 10, rank: 'Master baiter (admin)'};
    }

    for (let i = 0; i < this.rankingData.ranks.length; i++) {
      if (user.points < this.rankingData.pointBreaks[i]) {
        return {
          level: this.rankingData.levels[i],
          rank: this.rankingData.ranks[i],
        };
      }
    }
    // this is returned when a user maxed out points with a hack
    return {level: 0, rank: '1337 h4xx0r'};
  }

  /**
   * Uploads a file to the this.cloud storage and adds a record in
   * the pictures table.
   * @param {string} localFilePath - local filenmame
   * @param {string} desc - description
   * @param {array<string>} tags - tag array
   * @param {boolean} del - if true, will delete the file after uploading
   */
  uploadAndUpdateDb(localFilePath, desc, tags, del) {
    const filePath = path.join(localFilePath);// normalize the path just in case
    console.log(`calculating md5: ${filePath}`);
    md5File(filePath).
        then(async (md5) => {
          console.log(`file md5: ${md5}`);
          const ext = path.parse(filePath).ext;
          const cloudname = md5 + ext;
          await this.cloud.simpleUpload(md5 + ext, filePath);
          await this.addPicToDb(cloudname, tags, desc);
          if (del) {
            fs.unlink(filePath, () => {
              console.log('file deleted from local');
            });
          }
          console.log(`Upload of ${localFilePath} successful`);
        }).catch((reason) => {
          console.log(`error while uploading to cloud:${reason}`);
        });
  }

  /**
  * Inserts image info and tags it in the database.
  * @param {string} filename - filename as in the cloud
  *  (the md5 name). Also known as the key
  * @param {array<string>} tags - tag array
  * @param {string} desc - Description
  */
  async addPicToDb(filename, tags, desc) {
    this.db.pictures.add(desc, filename, tags).then((data) => {
      console.log(`${data.filename} added to database.`);
    }).catch((e) => {
      console.log(`error adding to database: ${e}`);
    });
  }

  /**
   * Generates a string of random characters
   * @param {int} length - string length
   * @return {string} - the random string
   */
  randomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  /**
   * Creates an array of {tags,filename} objects
   * @param {string} dir - Directory to scan
   * @return {array} The array of {tags,filename} objects
   */
  scanAndTag(dir) {
    /**
      * Creates an array files in the dir
      * @param {string} dir - Directory to scan
      * @param {array} files_ - Used internally, dont pass any argument
      * @return {array} The array of files in the dir
     */
    const getFiles = function(dir, files_) {
      files_ = files_ || [];
      const files = fs.readdirSync(dir);
      for (const i in files) {
        if (Object.prototype.hasOwnProperty.call(files, i)) {
          const name = path.join(dir, files[i]);
          if (fs.statSync(name).isDirectory()) {
            getFiles(name, files_);
          } else {
            files_.push(name);
          }
        }
      }
      return files_;
    };

    const taggedFileKVPArray=[];
    const rawFiles=getFiles(dir);
    const absPathLength=dir.split(path.sep).length;
    for (let i = 0; i<rawFiles.length; i++) {
      // Reset the KVP
      const tempKVP={filename: '', tags: []};

      // Extract the tags from the path
      const tagList=[];
      const pathArray=rawFiles[i].split(path.sep);
      for (let j=absPathLength; j<pathArray.length-1; j++) {
        tagList.push(pathArray[j]);
      }

      // Save the KVP of the current file
      tempKVP.filename=rawFiles[i];
      tempKVP.tags=tagList;
      taggedFileKVPArray.push(tempKVP);
    }

    return taggedFileKVPArray;
  }

  /**
    * handles errors
    * @param{Error} err - the error to handle
    * @param{Request} req - the request to process
    * @param{Response} res - the response to send back
    * @param{Function} next - i have no idea
    * @return{void}
    */
  errorHandler(err, req, res, next) {
    if (typeof (err) === 'string') {
      // custom application error
      return res.status(400).json({message: err});
    }

    // default to 500 server error
    return res.status(500).json({message: err.message});
  }

  /**
   * Reloads the tags from the tags table
   */
  async refreshTags() {
    this.tags=await this.db.tags.all();
  }
}

module.exports = Declutter;

