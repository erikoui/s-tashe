/**
 * @module chan-parser
 */
// TODO: replace got with needle
const got = require('got');
const {db} = require('./db');

/**
 * checks 4chan and returns an array of interesting thread urls.
 * @class
 */
class ChanParser {
  /**
   * @constructor
   *
   */
  constructor() {
    this.threads = [];
  }

  /**
   *
   * @param {string} board - `'a'`, `'b'`, `'gif'`,...
   */
  async loadBoardJson(board) {
    const checkTags = await this.getAllTagsAndAltsArray();

    const urls = [];
    // remove any slashes that may have been passed by accident
    board = board.replace(/\//g, '');
    // Set up request options
    const boardUrl = `https://a.4cdn.org/${board}/catalog.json`;

    try {
      // TODO: replace got with needle
      const parsedData = await got(boardUrl).json();
      for (let i = 0; i < parsedData.length; i++) {// page
        for (let j = 0; j < parsedData[i].threads.length; j++) {// thread
          // eslint-disable-next-line max-len
          const thisthread = `https://boards.4chan.org/${board}/thread/${parsedData[i].threads[j].no}`;
          // eslint-disable-next-line max-len
          const subject = `${parsedData[i].threads[j].sub || ''} ${parsedData[i].threads[j].com || ''}`;

          // Check if thread has our tags in the subject or comment
          if (this.isInteresting(subject, checkTags)) {
            urls.push(thisthread);
          }
        }
      }
      return urls;
    } catch (e) {
      console.error(`Got error: ${e.message}`);
    }
  }

  /**
   * @return {array} - tag list including alts
   */
  async getAllTagsAndAltsArray() {
    // Load tags from database
    const tags = await db.tags.all();
    // Clean them up to use as a single array of words
    let checkTags = [];
    for (let i = 0; i < tags.length; i++) {
      checkTags.push(tags[i].tag);
      if (tags[i].alts != null) {
        checkTags = checkTags.concat(tags[i].alts.concat(tags[i].tag));
      }
    }
    console.log('Tags loaded: ' + checkTags);
    return checkTags;
  }

  /**
   * Checks if the thread is interesting (contains tags that are
   * in our database)
   *
   * @param {string} subCom - thread subject and title comment
   * @param {array<string>} tagList - array of tags to check
   * concatenated with a space between them
   *
   * @return {boolean} - wether the tread is interesting
   */
  isInteresting(subCom, tagList) {
    // make bag of words from the title post including its subject
    let tbag = subCom;
    // clean up any weird characters
    tbag = tbag.replace(/\//g, ' ');
    tbag = tbag.replace(/[^a-zA-Z ]/g, '');

    // normalize
    tbag = tbag.toLowerCase();

    const bag = tbag.split(' ');
    for (let j = 0; j < bag.length; j++) {
      if (tagList.includes(bag[j])) {
        return true;
      }
    }
    return false;
  }
}


module.exports = ChanParser;
