// Adapted from https://github.com/nuclearace/4chan-Image-Downloader
// downloads the images from a 4chan thread.
const fs = require('fs');
const path = require('path');
const { db } = require('./db2');
const needle = require('needle');

let threadFolder = __dirname;
/**
 * downloads 4chan
 */
class ChanDownloader {
  /**
   * @constructor
   *
   * @param {module} declutter - declutter
   */
  constructor(declutter) {
    this.imageDownloadLimiter = declutter.imageDownloadLimiter;
    this.uploadLimiter = declutter.uploadLimiter;
    this.declutter = declutter;
    this.chanParser = declutter.chanParser
  }

  /**
   * downloads thread
   * @param {string} threadUrl - thread url
   */
  async downloadThread(threadUrl) {
    console.log('Downloading thread ' + threadUrl);
    let { board, thread } = await this.chanParser.getBoardAndThreadFromURL(threadUrl);
    // Make a local directory to store the images temporarily
    threadFolder = path.join(__dirname, board + '_' + thread) + '/';
    try {
      fs.mkdirSync(
        threadFolder,
        (err) => {
          console.error('mkdir error: ' + err);
        });
    } catch (e) {
      console.log('Cannot make directory, assuming it exists.');
    }

    // Download the thread JSON
    const jsonURL = `https://a.4cdn.org//${board}/thread/${thread}.json`;
    try {
      const { posts, validTags, imgDesc } = await this.chanParser.getThreadDetails(jsonURL);
      const that = this;
      let processedPics = 0;
      let totalPics = posts.length;
      // For each post download the file
      for (let i = 0; i < posts.length; i++) {
        // If the current post has a file
        if ('filename' in posts[i]) {
          // 4chan saves md5 sum of the files as base64, here i convert it to hex because i 
          // calculate hex md5s in other places and want it to be the same everywhere.
          const md5 = this.declutter.b64md52hex(posts[i]['md5']);
          // Image extension
          const imageExtension = posts[i]['ext'];
          // This is the timestamp filename, not the original, would be cool if I got the original
          // filename.
          const imageName = posts[i]['tim'];
          // img src
          const imageUrl = `https://i.4cdn.org/${board}/${imageName + imageExtension}`;
          // Temporary save path for this image (i want this temp and then move to final so that 
          // if the file system changes or I want to save somewhere else I can do that by 
          // changing cos.js only.)
          const filePath = path.join(threadFolder, imageName + imageExtension);
          // Save number of current pic so we can see progress in console
          const currentpic = processedPics;

          // Here we check if the file is not in the database, even though it is
          // also checked in declutter.uploadAndUpdateDb because we want to skip
          // the download of the picture as well.
          if (!(await this.declutter.checkMd5ExistsInDb(md5, imageExtension))) {
            this.imageDownloadLimiter.removeTokens(1, () => {
              try {
                // Download the file if not exist on disk
                if (!fs.existsSync(filePath)) {
                  console.log(`(${currentpic}/${totalPics} ${validTags[0]}) Downloading ${imageUrl}`);
                  // save the variables as constants to prevent async race conditions
                  const out = fs.createWriteStream(filePath);
                  const res = needle.get(imageUrl);
                  res.pipe(out);
                  res.on('end', function (err) {
                    if (err) {
                      console.log(`(${currentpic}/${totalPics} ${validTags[0]}) An error ocurred: ${err.message}`);
                      throw err;
                    }

                    // Upload the file and delete it
                    if (fs.existsSync(filePath)) {
                      that.uploadLimiter.removeTokens(1, () => {
                        that.declutter.uploadAndUpdateDb(
                          filePath,
                          imgDesc,
                          validTags,
                          true,
                        );
                      });
                      console.log(`(${currentpic}/${totalPics} ${validTags[0]}) Image ${imageName} saved. md5: ${md5}.`);
                    } else {
                      throw "Tried to upload file before it existed.";
                    }
                  });
                }
                // Upload the file and delete it
                else {
                  if (fs.existsSync(filePath)) {
                    that.uploadLimiter.removeTokens(1, () => {
                      that.declutter.uploadAndUpdateDb(
                        filePath,
                        imgDesc,
                        validTags,
                        true,
                      );
                    });
                  }
                  else {
                    throw "Tried to upload file before it existed.";
                  }
                }
              } catch (e) {
                console.error(`Error while downloading image: ${e}`);
              }
            });
          } else {
            console.log(`(${processedPics}/${totalPics} ${validTags[0]}) File already in database`);
          }
          processedPics++;
        } else {
          totalPics--;
        }
        if (processedPics == totalPics) {
          console.log(`Done downloading ${threadUrl}`);
        }
      }
    } catch (e) {
      console.error(`Error while downloading thread json: ${e}`);
    }
  }

  async getThreadDetails(jsonURL) {
    const threadRaw = await needle('get', jsonURL);
    const threadJSON = threadRaw.body;
    const posts = threadJSON['posts'];
    // Get tags of this thread
    let tbag = threadJSON['posts'][0].sub + ' ' + threadJSON['posts'][0].com;
    const imgDesc = tbag;
    tbag = tbag.replace(/\//g, ' ');
    tbag = tbag.replace(/[^a-zA-Z ]/g, '');
    tbag = tbag.toLowerCase();
    const bagOfWords = tbag.split(' ');

    // Get list of tags (main tags - no aliases)
    const validTags = await this.getValidTags(bagOfWords);
    console.log('Detected tags: ' + JSON.stringify(validTags));
    return { posts, validTags, imgDesc };
  }

}

module.exports = ChanDownloader;


