// Adapted from https://github.com/nuclearace/4chan-Image-Downloader
// downloads the images from a 4chan thread.

// TODO: match keywords from the thread title and set them as suggested
// TODO: you should only be able to run this script as an admin or automatically


const RateLimiter = require("limiter").RateLimiter
const fs = require("fs")
const https = require("https")
const domain = require("domain")
const request = require("request")
const path = require("path")
const { db } = require("../db")

var imageLimiter = new RateLimiter(1, "second")
var threadFolder = __dirname

function Grabber(thread) {
    process.send({ log: "Downloading thread " + thread })
    var self = this

    var threadInfo = thread.match(/https?\:\/\/boards\.4chan\.org\/(.*)\/thread\/(\d*)/)
    if (!threadInfo)
        return process.send({ log: "send: Not a valid 4chan thread link: " + thread })
    else
        process.send({ log: "Verified link regex: " + thread })
    this.board = threadInfo[1]
    this.thread = threadInfo[2]
    // I prefer saving the pics in folders so that I know what's going on without the db
    // uncomment this in case the server accepts persistent local storage
    threadFolder = path.join(__dirname, this.board + "_" + this.thread) + "/"
    fs.mkdir(threadFolder, self.getThreadJSON(this.board, this.thread), (err) => { process.emitWarning("Couldnt make directory") })
}

Grabber.prototype.getImages = function (json) {
    var self = this
    var threadJSON = json

    var posts = threadJSON["posts"]
    var tim, ext, filename, extras

    var createFun = function (ext, tim) {
        var options = {
            host: "https://i.4cdn.org",
            path: "/" + self.board + "/" + tim + ext
        }

        return imageLimiter.removeTokens(1, () => {
            if (tim !== undefined) {
                var imageName = tim;
                var imageExtention = ext;
                var imageUrl = options.host + options.path//imagename and imageextrention not needed because it is already in image.path
                if (fs.existsSync(threadFolder + imageName + imageExtention)) {
                    process.send({ log: 'Image: ' + imageName + imageExtention + " already exists, not saving this image." });
                } else {
                    process.send({ log: "Saving image: " + imageName + imageExtention });
                    request(imageUrl).pipe(fs.createWriteStream(threadFolder + imageName + imageExtention)).on("finish", function () {
                        process.send({ log: "Image " + imageName + " saved" })
                    });
                }
                process.send({ filenames: threadFolder + imageName + imageExtention })
            }
        })
    }

    for (var i = 0; i < posts.length; i++) {
        if ("filename" in posts[i]) {
            ext = posts[i]["ext"]
            tim = posts[i]["tim"]
            createFun(ext, tim)
        }
    }
};

Grabber.prototype.findTags = function (json) {
    const titlePost = json.posts[0]
    var bag = titlePost.sub + " " + titlePost.com//make bag of words from the title post including its subject
    bag = bag.replace(/[^a-zA-Z ]/g, "")//clean up any weird characters
    bag = bag.toLowerCase()//normalize
    bag = bag.split(" ")//turn it into an array

    db.tags.all().then((tags)=>{
        //TODO: do something with the tag JSON
    });

    
}

Grabber.prototype.getThreadJSON = function (board, thread) {
    var self = this
    var options = {
        hostname: "a.4cdn.org",
        path: "/" + board + "/thread/" + thread + ".json",
        method: 'GET'
    }

    imageLimiter.removeTokens(1, function () {
        const req = https.request(options, (res) => {
            const { statusCode } = res;
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
                //console.error(error.message);
                // Consume response data to free up memory
                res.resume();
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    self.findTags(parsedData);
                    self.getImages(parsedData);
                    console.log("uncomment getImages")
                } catch (e) {
                    console.error(e.message);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
        });
        req.end()
    })
};

Grabber.prototype.urlRetrieve = function (transport, options, callback) {
    var dom = domain.create()
    dom.on("error", function (err) {
        process.emitWarning("Error in chan-downloader: " + JSON.stringify(err))
    })
    dom.run(function () {
        var req = transport.request(options, function (res) {
            res.setEncoding("binary")
            var buffer = ""
            res.on("data", function (chunk) {
                buffer += chunk
            })
            res.on("end", function () {
                callback(res.statusCode, buffer)
            })
        })
        req.end()
    })
};


//this iterates over the arguments when run as standalone script
process.argv.forEach(function (val, index, array) {
    if (index < 2)
        return
    new Grabber(val)
})