// Adapted from https://github.com/nuclearace/4chan-Image-Downloader
// downloads the images from a 4chan thread.
const fs = require('fs');
const path = require('path');
const {db} = require('./db');
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
    this.imageLimiter = declutter.imageLimiter;
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
      tbag = tbag.replace(/[^a-zA-Z ]/g, '');
      tbag = tbag.toLowerCase();
      const bag = tbag.split(' ');

      const tags=await db.tags.all();
      const validTags = [];
      for (let i = 0; i < tags.length; i++) {
        let checkTags = [tags[i].tag];
        if (tags[i].alts != null) {
          checkTags = tags[i].alts.concat(tags[i].tag);
        }
        for (let j = 0; j < bag.length; j++) {
          if ((checkTags.includes(bag[j])) &&
              !(validTags.includes(bag[j]))) {
            validTags.push(tags[i].tag);
            break;
          }
        }
      }
      console.log('Detected tags: '+JSON.stringify(validTags));

      const that=this;
      // TODO: remove the consts and the if(fname)
      // For each post download the file
      for (let i = 0; i < posts.length; i++) {
        if ('filename' in posts[i]) {
          const md5 = this.declutter.b64md52hex(posts[i]['md5']);
          const ext = posts[i]['ext'];
          const fname = posts[i]['tim'];
          const imageUrl = `https://i.4cdn.org/${board}/${fname + ext}`;
          if (!(await this.declutter.checkMd5ExistsInDb(md5, ext))) {
          // save the variables as constants to prevent async race conditions
            const imageName = fname;
            const imageExtension = ext;
            const filePath = threadFolder + imageName + imageExtension; ;
            if (fs.existsSync(threadFolder + imageName + imageExtension)) {
              console.log(`(${i+1}/${posts.length}) \
Image ${imageName}${imageExtension} already exists on local, \
not saving this image.`);
            } else {
              this.imageLimiter.removeTokens(1, () => {
                try {
                  console.log(
                      `(${i+1}/${posts.length}) Downloading ${imageUrl}`,
                  );
                  const out = fs.createWriteStream(filePath);
                  const res = needle.get(imageUrl);
                  res.pipe(out);
                  res.on('end', function(err) {
                    if (err) {
                      console.log(`(${i+1}/${posts.length}) \
An error ocurred: ${err.message}`);
                    } else {
                      console.log(
                          `(${i+1}/${posts.length}) Image ${imageName} saved.`,
                      );
                      // Upload the file and delete it
                      that.declutter.uploadAndUpdateDb(
                          filePath,
                          'no description',
                          validTags,
                          true,
                      );
                    }
                  });
                } catch (e) {
                  console.error(`Error while downloading image: ${e}`);
                }
              });
            }
          } else {
            console.log(`(${i+1}/${posts.length}) File already in database`);
          }
        }
      }
    } catch (e) {
      console.error(`Error while downloading thread json: ${e}`);
    }
  }
}

module.exports = ChanDownloader;


