// Adapted from https://github.com/nuclearace/4chan-Image-Downloader
// downloads the images from a 4chan thread.
const fs = require('fs');
const path = require('path');
const {db} = require('./db2');
const needle = require('needle');
const {RateLimiter} = require('limiter');

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
    this.imageLimiter = declutter.imageLimiter;
    this.uploadLimiter = new RateLimiter(3, 'minute');
    this.declutter = declutter;
  }

  /**
   * downloads thread
   * @param {string} threadUrl - thread url
   */
  async downloadThread(threadUrl) {
    console.log('Downloading thread ' + threadUrl);

    // Verify the thread link is valid
    const threadInfo = threadUrl.match(
        /https?\:\/\/boards\.4chan\.org\/(.*)\/thread\/(\d*)/,
    );
    if (!threadInfo) {
      console.log('Not a valid 4chan thread link: ' + threadUrl);
      return;
    } else {
      console.log('Verified link regex: ' + threadUrl);
    }

    const board = threadInfo[1];
    const thread = threadInfo[2];

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
      const threadRaw = await needle('get', jsonURL);
      const threadJSON = threadRaw.body;
      const posts = threadJSON['posts'];

      // Get tags of this thread
      const titlePost = posts[0];
      let tbag = titlePost.sub + ' ' + titlePost.com;
      tbag = tbag.replace(/\//g, ' ');
      tbag = tbag.replace(/[^a-zA-Z ]/g, '');
      tbag = tbag.toLowerCase();
      const bag = tbag.split(' ');

      // Get list of tags (main tags - no aliases)
      const tags = await db.tags.all();
      // Generate object {tag="...",alias=[..]}
      const alts = await db.tags.downloadTagListAndAlias();
      const tagObject={};
      tags.forEach((x)=>{
        tagObject[x.tag]=[x.tag];
      });
      alts.forEach((x)=>{
        if (x.tag in tagObject) {
          tagObject[x.tag].push(x.alias);
        } else {
          tagObject[x.tag]=[x.alias];
        }
      });
      /* {latex: [ 'latex' ],
          bimbo: [ 'bimbo', 'fake', 'bimbos', 'plastic' ],
          insta: [ 'insta', 'social', 'socials', 'fb', 'instagram' ],
          milf: [ 'milf' ],
          amateur: [ 'amateur', 'amateurs' ],
          celeb: [ 'celeb', 'celebs' ]
      }*/
      const validTags = [];
      for (let i = 0; i < tags.length; i++) {// For each main tag
        const checkTags = tagObject[tags[i].tag];
        for (let j = 0; j < bag.length; j++) {
          if ((checkTags.includes(bag[j])) &&
            !(validTags.includes(bag[j]))) {
            validTags.push(tags[i].tag);
            break;// this prevents multiple tags, maybe its wrong
          }
        }
      }
      console.log('Detected tags: ' + JSON.stringify(validTags));

      const that = this;
      let processedPics = 0;
      let totalPics = posts.length;
      // For each post download the file
      for (let i = 0; i < posts.length; i++) {
        // If the current post has a file
        if ('filename' in posts[i]) {
          const md5 = this.declutter.b64md52hex(posts[i]['md5']);
          const imageExtension = posts[i]['ext'];
          const imageName = posts[i]['tim'];
          const imageUrl = `https://i.4cdn.org/${board}/${imageName + imageExtension}`;
          const filePath =path.join(threadFolder, imageName+imageExtension);

          // Here we check if the file is in the database, even though it is
          // also checked in declutter.uploadAndUpdateDb because we want to skip
          // the download of the picture as well.
          if (!(await this.declutter.checkMd5ExistsInDb(md5, imageExtension))) {
            // save the variables as constants to prevent async race conditions

            this.imageLimiter.removeTokens(1, () => {
              try {
                // This never trues when i remove console log???
                console.log(filePath);
                if (fs.existsSync(filePath)) {
                  // eslint-disable-next-line max-len
                  console.log(`(${processedPics}/${totalPics} ${validTags[0]}) Image ${imageName}${imageExtension} already exists on local, not saving this image.`);
                  // Upload the file and delete it
                  that.uploadLimiter.removeTokens(1, ()=>{
                    that.declutter.uploadAndUpdateDb(
                        filePath,
                        'no description',
                        validTags,
                        true,
                    );
                  });
                } else {
                  // eslint-disable-next-line max-len
                  console.log(`(${processedPics}/${totalPics} ${validTags[0]}) Downloading ${imageUrl}`);
                  const out = fs.createWriteStream(filePath);
                  const res = needle.get(imageUrl);
                  res.pipe(out);
                  res.on('end', function(err) {
                    if (err) {
                      // eslint-disable-next-line max-len
                      console.log(`(${processedPics}/${totalPics} ${validTags[0]}) An error ocurred: ${err.message}`);
                    } else {
                      // eslint-disable-next-line max-len
                      console.log(`(${processedPics}/${totalPics} ${validTags[0]}) Image ${imageName} saved.`);
                      // Upload the file and delete it
                      that.uploadLimiter.removeTokens(1, ()=>{
                        that.declutter.uploadAndUpdateDb(
                            filePath,
                            'no description',
                            validTags,
                            true,
                        );
                      });
                    }
                  });
                }
              } catch (e) {
                console.error(`Error while downloading image: ${e}`);
              }
            });
          } else {
            // eslint-disable-next-line max-len
            console.log(`(${processedPics}/${totalPics} ${validTags[0]}) File already in database`);
            // TODO: delete the file if it exists on local
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
}

module.exports = ChanDownloader;


