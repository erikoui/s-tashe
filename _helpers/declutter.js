const md5File = require('md5-file');
const path = require('path');
const fs = require('fs');

const RateLimiter = require('limiter').RateLimiter;
const ChanDownloader = require('./chan-downloader');
const ChanParser = require('./chan-parser');
const ChanBlogger = require('./chan-blogger');
const chanParser = new ChanParser();
const needle = require('needle');
const imageThumbnail = require('image-thumbnail');
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
    this.imageLimiter = new RateLimiter(1, 1100);// 1 every 1100 ms
    this.thumbnailLimiter = new RateLimiter(3, 500);// 3 every 500 ms
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
    this.chanBlogger = new ChanBlogger(this);
    this.minVotes = 12;
    this.imgPrefixURL = `https://${process.env.COS_ENDPOINT}/${process.env.COS_BUCKETNAME}/`;
    this.tags = [];
    this.archivePicList = [];
    this.refreshTags().then(() => {
      console.log('Tags:' + this.tags.map((({tag}) => tag)));
      if (!process.env.ISLOCAL) {
        this.updateArchivePicList();
        this.chinScanner();
        this.blogPoster();
        this.makeThumbs(false);
      }
      console.log('Declutter loaded');
    }).catch((e) => {
      console.log(e);
    });
  }


  /**
   * Wrapper for running chanParser and chanDownloader
   */
  chinScanner() {
    chanParser.loadBoardJson('/s/').then((data) => {
      for (let i = 0; i < data.length; i++) {
        this.imageLimiter.removeTokens(1, () => {
          this.downloadThreadAndSaveToCloud(data[i]).then(() => {
          }).catch((e) => {
            console.error(e);
            console.error('error with download thread:' + e);
          });
        });
      }
      this.db.reports.add('chinScanner',
          data.length + ' threads downloaded on ' + Date().toString(),
          0,
          0,
          'System',
          '',
      );
    }).catch((e) => {
      console.error('error with loadBoardJson: ' + e);
    });
  };

  /**
  * Wrapper for running chanParser and chanDownloader
  */
  blogPoster() {
    chanParser.loadBoardJson('/s/').then((data) => {
      for (let i = 0; i < data.length; i++) {
        this.imageLimiter.removeTokens(1, () => {
          this.getReplyChainAndMakeBlogPost(data[i], 5).then(() => {
          }).catch((e) => {
            console.error(e);
            console.error('error with download thread:' + e);
          });
        });
      }
      this.db.reports.add('blogPoster',
          data.length + ' threads downloaded on ' + Date().toString(),
          0,
          0,
          'System',
          '',
      );
    }).catch((e) => {
      console.error('error with loadBoardJson: ' + e);
    });
  };


  /**
 * wrapper for chan-blogger
 * @param {string} url - thread url
 * @param {int} worth - how many replies needed to make this blog post
 */
  async getReplyChainAndMakeBlogPost(url, worth) {
    console.log('getting blog content');
    const content = await this.chanBlogger.getLongestReplyChain(url, 10);
    // console.log(content);
    if (content.content.length >= worth) {
      console.log('worht');
      await this.db.blog.addPost({
        abstract: this.beautifyContent(content.content),
        body: this.beautifyContent(content.content),
        title: content.thread,
      });
    }
  }
  /**
   * makes it into readable html
   * @param {content} content
   * @return {string} yes
   */
  beautifyContent(content) {
    let nice = '';
    for (let i =content.length-1; i >=0; i--) {
      nice = nice + '\n\n' + content[i].post.replace(/<a href=.+<\/a>/g, '');
    }
    console.log(nice);
    return nice;
  }

  /**
   * Generates thumbnails
   * @param {bool} force - when true, makes all thumbs. when false, makes
   * only missing thumbs
   *
   * @return {string} - message
   */
  makeThumbs(force) {
    // try to make thumbs directory
    const thumbsDir = './public/thumbs';
    try {
      fs.mkdirSync(thumbsDir);
    } catch (e) {
      console.log('Thumbnail directory could not be created.');
    }
    // get list of thumbnails already in folder
    const existingThumbs = [];
    try {
      fs.readdir(thumbsDir, (err, files) => {
        if (!err) {
          files.forEach((file) => {
            existingThumbs.push(file);
          });
        } else {
          throw new Error('error ' + err.message);
        }
      });
    } catch (e) {
      return e;
    }
    // get list of all files on db
    this.db.pictures.all().then((data) => {
      // get File names to make thumbnails for
      const makeThumbs = [];
      let existing = 0;
      // check if thumbs already exist
      for (let i = 0; i < data.length; i++) {
        if (!force) {
          if (existingThumbs.indexOf(data[i].filename) == -1) {
            makeThumbs.push(data[i].filename);
          } else {
            ++existing;
          }
        } else {
          makeThumbs.push(data[i].filename);
        }
      }
      console.log(existing + ' Thumbnails already exists');
      // Make temp directories
      try {
        fs.mkdirSync('./tmp');
      } catch (e) {
        console.log('Temp directory could not be created.');
      }
      for (let i = 0; i < makeThumbs.length; i++) {
        this.thumbnailLimiter.removeTokens(1, () => {
          // download image
          const filePath = './tmp/' + makeThumbs[i];
          const out = fs.createWriteStream(filePath);
          const res = needle.get(this.imgPrefixURL + makeThumbs[i]);
          res.pipe(out);
          res.on('end', function(err) {
            if (!err) {
              // generate thumbnail
              imageThumbnail(
                  filePath,
                  {
                    width: 150,
                  // fit: 'cover',
                  // jpegOptions: {force: true, quality: 80},
                  },
              ).then((thumbnail) => {
                // save thumbnail to disk
                try {
                  fs.writeFileSync(thumbsDir + '/' + makeThumbs[i], thumbnail);
                } catch (e) {
                  fs.copyFile(
                      './public/image-broken.png',
                      thumbsDir + '/' + makeThumbs[i].split('.')[0] + '.png',
                      () => {
                        console.log(makeThumbs[i] + ' saved as broken.png');
                      },
                  );
                  // delete file after thumbnail is made
                  fs.unlink('./tmp/' + makeThumbs[i], () => {
                    console.log(makeThumbs[i] + ' done');
                  });
                  console.error(makeThumbs[i]+ 'error:'+e);
                }

                // delete file
                fs.unlink('./tmp/' + makeThumbs[i], () => {
                  console.log(makeThumbs[i] + ' done');
                });
              }).catch((e) => {
                fs.copyFile(
                    './public/video-thumb.png',
                    thumbsDir + '/' + makeThumbs[i].split('.')[0] + '.png',
                    () => {
                    // delete file after thumbnail is made
                      fs.unlink('./tmp/' + makeThumbs[i], () => {
                        console.log(makeThumbs[i] + ' done');
                      });
                    },
                );
                // eslint-disable-next-line max-len
                console.log(makeThumbs[i] + '  *weird file type set generic thumbnail: ' + e.message);
              });
            } else {
              fs.copyFile(
                  './public/image-broken.png',
                  thumbsDir + '/' + makeThumbs[i].split('.')[0] + '.png',
                  () => {
                    // delete file after thumbnail is made
                    fs.unlink('./tmp/' + makeThumbs[i], () => {
                      console.log(makeThumbs[i] + ' done');
                    });
                  },
              );
              // eslint-disable-next-line max-len
              console.log('  *some error while making thumbnail, used broken.png: ' + e.message);
            }
          });
        });
      }
      // eslint-disable-next-line max-len
      this.db.reports.add('thumbnails',
          makeThumbs.length +
        ' thumbnails set to be generated on ' +
        Date().toString(),
          0,
          0,
          'System',
          '',
      );
      return (`${makeThumbs.length} Thumbnails will be generated.`);
    }).catch((e) => {
      console.error(e);
      return (e.message);
    });
  }
  /**
   * Updates the best pics list for each tag because it takes time.
   * Only the admin should call this directly, otherwise run it every 2 hours
   * or so.
   */
  updateArchivePicList() {
    console.log('Updating archive pic list');
    this.archivePicList = [];
    const that = this;
    const getTop = function(i) {
      if (i < that.tags.length) {
        that.db.pictures.topNandTag(
            1, that.minVotes, that.tags[i].tag,
        ).then((r) => {
          that.archivePicList.push({
            src: that.imgPrefixURL + r[0].filename,
            tag: that.tags[i].tag,
          });
          getTop(i + 1);
        }).catch((e) => {
          console.log(e);
          getTop(i + 1);
        });
      } else {
        console.log('Archive pic list updated');
      }
    };
    getTop(0);
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
        if (p == 10) {// check admin
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
    await this.db.tags.all().then((data) => {
      this.tags = data;
    }).catch((e) => {
      console.error(e);
      this.tags = [{tag: 'error loading all tags'}];
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

