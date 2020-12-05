const needle = require('needle');
/**
 * blogs 4chan
 */
class ChanBlogger {
  /**
   * @constructor
   *
   * @param {module} declutter - declutter
   */
  constructor(declutter) {
    // Load the image limiter from declutter
    this.imageLimiter = declutter.imageLimiter;
    this.declutter = declutter;
  }

  /**
   * Returns the longest reply chain of a thread.
   * @param {string} threadUrl - thread url
   */
  async getLongestReplyChain(threadUrl) {
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

    // Download the thread JSON
    const board = threadInfo[1];
    const thread = threadInfo[2];
    const jsonURL = `https://a.4cdn.org//${board}/thread/${thread}.json`;
    try {
      console.log('Getting thread...');
      const threadRaw = await needle('get', jsonURL);
      const threadJSON = threadRaw.body;
      const posts = threadJSON['posts'];
      // Make a graph of the posts
      const postsMap=new Map();
      for (let i = 0; i < posts.length; i++) {
        if (posts[i].com) {
          postsMap[posts[i].no]=posts[i].com;
        }
      }
      // Get the biggest reply chain end post no
      let maxRep=0;
      let maxPost=posts[0].no.toString;
      for (let i = 0; i < posts.length; i++) {
        // console.log(posts[i].no.toString())
        if (posts[i].com) {
          const depth=this.countDepth(postsMap, posts[i].no.toString(), 1);
          if (depth>=maxRep) {
            maxRep=depth;
            maxPost=posts[i].no.toString();
          };
        }
      }
      return this.makeJson(postsMap, maxPost, []);
    } catch (e) {
      console.error(`Error while downloading thread json: ${e}`);
      throw e;
    }
  }

  /**
   * counts how many replies led to the start post (going backwards)
   * @param {map} map - posts map
   * @param {string} start starting post id
   * @param {int} count - 0
   *
   * @return {int} - depth
   */
  countDepth(map, start, count) {
    if (count>25) {
      return count;
    }
    if (!map[start]) {
      return count;
    }
    if (map[start].match(/<\/a>$/)) {
      return count;
    }
    const children=map[start].match(/="#p(\d+)/g);
    if (!children) {
      return count;
    }
    let maxd=0;
    for (let i=0; i<children.length; i++) {
      const newd=this.countDepth(map, children[i].replace('="#p', ''), count+1);
      if (newd>maxd) {
        maxd=newd;
      }
    }
    return maxd;
  }

  /**
   *
   * @param {map} map map
   * @param {string} maxPost start
   * @param {array} json empty []
   *
   * @return {array} post aray
   */
  makeJson(map, maxPost, json) {
    if (!map[maxPost]) {
      return json;
    }
    if (!map[maxPost].match(/<\/a>$/)) {// filter replies with no text
      json.push({no: maxPost, post: map[maxPost].toString()});
    }
    const children=map[maxPost].match(/="#p(\d+)/);
    if (!children) {
      return json;
    }
    let maxd=0;
    let childi=0;
    for (let i=0; i<children.length; i++) {
      const newd=this.countDepth(map, children[i].replace('="#p', ''), 1);
      if (newd>maxd) {
        maxd=newd;
        childi=i;
      }
    }
    return this.makeJson(
        map,
        children[childi].replace('="#p', ''),
        json,
    );
  }
}

module.exports = ChanBlogger;


