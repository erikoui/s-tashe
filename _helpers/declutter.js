const md5File = require('md5-file');
const path = require('path');
const fs = require('fs');

const RateLimiter = require('limiter').RateLimiter;
const ChanDownloader = require('./chan-downloader');

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
    this.imageLimiter = new RateLimiter(1, 1100);
    this.db = database;
    this.cloud = cloudStorage;
    this.votePointIncrement = 1;
    this.rankingData = {
      ranks: ['newfag', 'pleb', 'rookie', 'new recruit',
        'experienced', 'veteran', 'coomer', 'wizard'],
      pointBreaks: [20, 100, 250, 500, 1000, 2000, 5000, 1000000],
      levels: [0, 1, 2, 3, 4, 5, 6, 7],
    };
    this.chanDownloader = new ChanDownloader(this);
    this.minVotes=7;
    this.imgPrefixURL=`https://${process.env.COS_ENDPOINT}/${process.env.COS_BUCKETNAME}/`;
    this.tags=[];
    this.archivePicList=[];
    this.refreshTags().then(()=>{
      this.updateArchivePicList();
    }).catch((e)=>{
      console.log(e);
    });
    console.log('Declutter loaded');
  }

  /**
   * Updates the best pics list for each tag because it takes time.
   * Only the admin should call this directly, otherwise run it every 2 hours
   * or so.
   */
  async updateArchivePicList() {
    console.log('Updating archive pic list');
    this.archivePicList=[];
    console.log(this.tags);
    for (let i=0; i<this.tags.length; i++) {
      const r=await this.db.pictures.topNandTag(
          1, this.minVotes, this.tags[i].tag,
      );
      console.log(r);
      this.archivePicList.push({
        src: this.imgPrefixURL+r[0].filename,
        tag: this.tags[i].tag,
      });
    }
    console.log(this.archivePicList);
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
 * checks if the user has sufficient priviledges (middleware)
 * @param {int} p - minimum level (10 is admin)
 * @param {boolean} json - retrun response in json mode?
 * @return {function} - function that either allows the next
 *  middleware to run or blocks it
 */
  checkLevel(p, json) {
    return (req, res, next) => {
      if (req.user) {
        if (p==10) {// check admin
          if (req.user.admin) {
            next();
          } else {
            if (json) {
              res.json({
                err: true,
                message: 'You have to be an admin to do this.',
              });
            } else {
              res.end('You have to be an admin to do this.');
            }
          }
        } else {// not an admin
          if (req.user.level >= p) {
            next();
          } else {
            if (json) {
              res.json({
                err: true,
                message: `You have to be at least level ${p} to do this`,
              });
            } else {
              res.end(`You have to be at least level ${p} to do this`);
            }
          }
        }
      } else { // not logged in
        if (json) {
          res.json({
            err: true,
            message: `You have to be logged in to do this.`,
          });
        } else {
          res.end('You have to be logged in to do this.');
        }
      }
    };
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
    md5File(filePath).then(async (md5) => {
      const ext = path.parse(filePath).ext;
      const cloudname = md5 + ext;
      console.log(`${cloudname} : Uploading file...`);

      // Upload
      const exists = await this.checkMd5ExistsInDb(md5, ext);
      if (!exists) {
        try {
          await this.cloud.simpleUpload(md5 + ext, filePath);
          console.log(`${cloudname} : upload successful`);

          // Delete the file if del is true
          if (del) {
            fs.unlink(filePath, () => {
              console.log(`${cloudname} : file deleted from local`);
            });
          }

          // Update database
          try {
            await this.addPicToDb(cloudname, tags, desc);
          } catch (e) {
            console.error(`${cloudname} : error while updating database: ${e}`);
          }
        } catch (e) {
          console.error(`${cloudname} : error while uploading to cloud: ${e}`);
        }
      } else {
        console.log(`image already in database`);
      }
    }).catch((e) => {
      console.error(`${filePath} : error callculating MD5: ${e}`);
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

    const taggedFileKVPArray = [];
    const rawFiles = getFiles(dir);
    const absPathLength = dir.split(path.sep).length;
    for (let i = 0; i < rawFiles.length; i++) {
      // Reset the KVP
      const tempKVP = {filename: '', tags: []};

      // Extract the tags from the path
      const tagList = [];
      const pathArray = rawFiles[i].split(path.sep);
      for (let j = absPathLength; j < pathArray.length - 1; j++) {
        tagList.push(pathArray[j]);
      }

      // Save the KVP of the current file
      tempKVP.filename = rawFiles[i];
      tempKVP.tags = tagList;
      taggedFileKVPArray.push(tempKVP);
    }

    return taggedFileKVPArray;
  }

  /**
     * converts b64 md5 to hexadecimal
     * @param {string} b64md5 - base64 encoded md5 sum
     * @return {string} - hexadecimal 24 digit md5
     */
  b64md52hex(b64md5) {
    const buffer = Buffer.from(b64md5, 'base64');
    return buffer.toString('hex');
  }

  /**
     *
     * @param {string} md5 - hex encoded md5
     * @param {string} ext - file extension ('.jpg')
     * @return {boolean} - wether it exists
     */
  async checkMd5ExistsInDb(md5, ext) {
    try {
      await this.db.pictures.findByFilename(md5 + ext);
    } catch (e) {
      return false;
    }
    return true;
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
    await this.db.tags.all().then((data)=>{
      this.tags= data;
    }).catch((e)=>{
      console.error(e);
      this.tags= [{tag: 'error loading all tags'}];
    });
  }

  /**
     *
     * @param {string} thread - thread url
     */
  async downloadThreadAndSaveToCloud(thread) {
    this.chanDownloader.downloadThread(thread);
  }
}
module.exports = Declutter;

