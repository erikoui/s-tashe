// Adapted from https://github.com/nuclearace/4chan-Image-Downloader
// downloads the images from a 4chan thread.

const RateLimiter = require('limiter').RateLimiter;
const fs = require('fs');
const https = require('https');
const domain = require('domain');
const request = require('request');
const path = require('path');
const {db} = require('./db');

const imageLimiter = new RateLimiter(1, 'second');
let threadFolder = __dirname;

/** Grabs pictures from the given thread
 * @class
 * @param{string} thread - the full thread url including https://
 */
function Grabber(thread) {
  process.send({log: 'Downloading thread ' + thread});
  const self = this;

  const threadInfo = thread.match(
      /https?\:\/\/boards\.4chan\.org\/(.*)\/thread\/(\d*)/,
  );
  if (!threadInfo) {
    return process.send({
      log: 'send: Not a valid 4chan thread link: ' + thread,
    });
  } else {
    process.send({log: 'Verified link regex: ' + thread});
  }
  this.board = threadInfo[1];
  this.thread = threadInfo[2];
  threadFolder = path.join(__dirname, this.board + '_' + this.thread) + '/';
  fs.mkdir(threadFolder, self.getThreadJSON(this.board, this.thread), (err) => {
    process.emitWarning('Couldnt make directory');
  });
}

Grabber.prototype.getImages = function(json) {
  const self = this;
  const threadJSON = json;

  const posts = threadJSON['posts'];
  const createFun = function(ext, fname) {
    const options = {
      host: 'https://i.4cdn.org',
      path: '/' + self.board + '/' + fname + ext,
    };

    return imageLimiter.removeTokens(1, () => {
      if (fname) {
        // save the variables as constants to prevent async race conditions
        const imageName = fname;
        const imageExtension = ext;
        const imageUrl = options.host + options.path;
        const filePath = threadFolder + imageName + imageExtension; ;
        if (fs.existsSync(threadFolder + imageName + imageExtension)) {
          process.send({
            log: `Image ${imageName}${imageExtension} 
            already exists, not saving this image.`});
        } else {
          process.send({log: 'Saving image: ' + imageName + imageExtension});
          request(imageUrl)
              .pipe(fs.createWriteStream(filePath))
              .on('finish', () => {
                process.send({log: 'Image ' + imageName + ' saved'});
              });
        }
        process.send({filenames: filePath});
      }
    });
  };

  for (let i = 0; i < posts.length; i++) {
    if ('filename' in posts[i]) {
      ext = posts[i]['ext'];
      fname = posts[i]['tim'];
      createFun(ext, fname);
    }
  }
};

Grabber.prototype.findTags = function(json) {
  const titlePost = json.posts[0];

  // make bag of words from the title post including its subject
  let tbag = titlePost.sub + ' ' + titlePost.com;

  // clean up any weird characters
  tbag = tbag.replace(/[^a-zA-Z ]/g, '');

  // normalize
  tbag = tbag.toLowerCase();

  // turn it into an array and set as const to persist through to .then
  const bag = tbag.split(' ');

  db.tags.all()
      .then((tags) => {
        const validTags = [];
        for (let i = 0; i < tags.length; i++) {
          let checkTags = [tags[i].tag];
          if (tags[i].alts != null) {
            checkTags = tags[i].alts.concat(tags[i].tag);
          }
          for (let j = 0; j < bag.length; j++) {
            if ((checkTags.includes(bag[j])) && !(validTags.includes(bag[j]))) {
              validTags.push(bag[j]);
            }
          }
        }
        process.send({tags: validTags});
      })
      .catch((e) => {
        console.log('error with database getting tags:' + e);
      });
};

Grabber.prototype.getThreadJSON = function(board, thread) {
  const self = this;
  const options = {
    hostname: 'a.4cdn.org',
    path: '/' + board + '/thread/' + thread + '.json',
    method: 'GET',
  };

  imageLimiter.removeTokens(1, function() {
    const req = https.request(options, (res) => {
      const {statusCode} = res;
      const contentType = res.headers['content-type'];

      let error;
      // Any 2xx status code signals a successful response but
      // here we're only checking for 200.
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        process.emitWarning(error.message);
        // console.error(error.message);
        // Consume response data to free up memory
        res.resume();
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          self.findTags(parsedData);// returns tags to the main program
          self.getImages(parsedData);// returns image paths to the main program
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', (e) => {
      console.error(`Got error: ${e.message}`);
    });
    req.end();
  });
};

Grabber.prototype.urlRetrieve = function(transport, options, callback) {
  const dom = domain.create();
  dom.on('error', function(err) {
    process.emitWarning('Error in chan-downloader: ' + JSON.stringify(err));
  });
  dom.run(function() {
    const req = transport.request(options, function(res) {
      res.setEncoding('binary');
      let buffer = '';
      res.on('data', function(chunk) {
        buffer += chunk;
      });
      res.on('end', function() {
        callback(res.statusCode, buffer);
      });
    });
    req.end();
  });
};


// this iterates over the arguments when run as standalone script
process.argv.forEach(function(val, index, array) {
  if (index < 2) {
    return;
  }
  new Grabber(val);
});
