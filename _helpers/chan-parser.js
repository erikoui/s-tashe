const needle = require('needle');
const { db } = require('./db2');

/**
 * checks 4chan and returns an array of interesting thread urls.
 * @class
 */
class ChanParser {
  /**
   * @constructor
   *
   */
  constructor(declutter) {
    this.threads = [];
    this.imageDownloadLimiter = declutter.imageDownloadLimiter;
    this.uploadLimiter = declutter.uploadLimiter;
    this.declutter = declutter;
    this.tagObject = this.getTagObject();
  }

  /**
   *
   * @param {string} board - `'a'`, `'b'`, `'gif'`,...
   */
  async loadBoardJson(board) {
    const urls = [];
    // remove any slashes that may have been passed by accident
    board = board.replace(/\//g, '');
    // Set up request options
    const boardUrl = `https://a.4cdn.org/${board}/catalog.json`;

    try {
      const boardRaw = await needle('get', boardUrl);
      const parsedData = boardRaw.body;
      for (let i = 0; i < parsedData.length; i++) {// page
        for (let j = 0; j < parsedData[i].threads.length; j++) {// thread
          const threadURL=`https://boards.4chan.org/${board}/thread/${parsedData[i].threads[j].no}`;
          // Check if thread has our tags in the subject or comment
          let bigstring = `${parsedData[i].threads[j].sub || ''} ${parsedData[i].threads[j].com || ''}`;
          bigstring = bigstring.toLowerCase();
          bigstring = bigstring.replace(/\//g, ' ');
          bigstring = bigstring.replace(/[^a-zA-Z ]/g, '');
          const bag = bigstring.split(" ");
          if ((await this.getValidTags(bag)).length > 0) {
            console.log("Found thread with title " + parsedData[i].threads[j].sub)
            urls.push(threadURL);
          }
        }
      }
      return urls;
    } catch (e) {
      console.error(`Got error: ${e.message}`);
    }
  }

  async getBoardAndThreadFromURL(threadUrl) {
    // Verify the thread link is valid
    const threadInfo = threadUrl.match(
      /https?\:\/\/boards\.4chan\.org\/(.*)\/thread\/(\d*)/,
    );
    if (!threadInfo) {
      console.log('Not a valid 4chan thread link: ' + threadUrl);
      throw 'Not a valid 4chan thread link: ' + threadUrl;
    } else {
      console.log('Verified link regex: ' + threadUrl);
    }

    const board = threadInfo[1];
    const thread = threadInfo[2];
    return {board, thread}
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

  async getValidTags(bag) {
    const validTags = [];
    const searchTags=await this.tagObject;
    for (let tag in searchTags) {
      const checkTags = searchTags[tag];
      for (let j = 0; j < bag.length; j++) {
        if ((checkTags.includes(bag[j])) &&
          !(validTags.includes(bag[j]))) {
          validTags.push(tag);
          break; // this prevents multiple tags, maybe its wrong
        }
      }
    }
    // if (validTags.length > 0) {
    //   console.log("From bag:")
    //   console.log(bag)
    //   console.log("Got tags:")
    //   console.log(validTags)
    // }
    return validTags;
  }

  async getTagObject() {
    const tags = await db.tags.all();
    // Generate object {tag="...",alias=[..]}
    const alts = await db.tags.downloadTagListAndAlias();
    const tagObject = {};
    tags.forEach((x) => {
      tagObject[x.tag] = [x.tag];
    });
    alts.forEach((x) => {
      if (x.tag in tagObject) {
        tagObject[x.tag].push(x.alias);
      } else {
        tagObject[x.tag] = [x.alias];
      }
    });
    console.log("Tag Object created");
    console.log(tagObject);
    return tagObject;
  }
}


module.exports = ChanParser;
