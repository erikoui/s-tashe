// Adapted from https://github.com/nuclearace/4chan-Image-Downloader
// downloads the images from a 4chan thread.

// TODO: match keywords from the thread title and set them as suggested
// TODO: you should only be able to run this script as an admin or automatically


var RateLimiter = require("limiter").RateLimiter
var fs = require("fs")
var https = require("https")
var domain = require("domain")
const request = require("request")
var path = require("path")

var imageLimiter = new RateLimiter(1, "second")
var threadFolder = __dirname

function Grabber(thread) {
    console.log("Downloading thread " + thread)
    var self = this

    var threadInfo = thread.match(/https?\:\/\/boards\.4chan\.org\/(.*)\/thread\/(\d*)/)
    if (!threadInfo)
        return process.send({ log: "send: Not a valid 4chan thread link: " + thread })
    else
        process.send({ log: "Verified link regex: " + thread })
    this.board = threadInfo[1]
    this.thread = threadInfo[2]

    // I prefer saving the pics in folders so that I know what's going on without the db
    threadFolder = path.join(__dirname, this.board + "_" + this.thread) + "/"
    fs.mkdir(threadFolder, self.getThreadJSON(this.board, this.thread), (err) => { process.send({ log: "Error making directory" }) })
}

Grabber.prototype.getImages = function (json, eightChan) {
    var self = this
    var threadJSON = json

    var posts = threadJSON["posts"]
    var tim, ext, filename, extras

    var createFun = function (url, ext, tim) {
        fs.stat(self.board + "_" + self.thread + "/" + tim + ext, function (err, stat) {
            if (err == null)
                return console.log("Already exists: " + tim + ext)
            else
                postCheck()
        })

        var postCheck = function () {
            var options = {
                host: "https://i.4cdn.org",
                path: "/" + self.board + "/" + tim + ext
            }

            return imageLimiter.removeTokens(1, () => {
                if (tim !== undefined) {
                    var imageName = tim;
                    var imageExtention = ext;
                    var imageUrl = options.host + options.path//imagename and imageextrention not needed because it is already in image.path
                    //console.log("Would download " + imageUrl + " to " + threadFolder + imageName + imageExtention)
                    if (fs.existsSync(threadFolder + imageName + imageExtention)) {
                        console.log('Image: ' + imageName + imageExtention + " already exists, not saving this image.");
                    } else {
                        console.log("Saving image: " + imageName + imageExtention);
                        request(imageUrl).pipe(fs.createWriteStream(threadFolder + imageName + imageExtention)).on("finish", function () { console.log("Image saved") });
                    }

                }
            })
        }
    }

    for (var i = 0; i < posts.length; i++) {
        if ("filename" in posts[i]) {
            filename = posts[i]["filename"]
            ext = posts[i]["ext"]
            tim = posts[i]["tim"]
            createFun(filename, ext, tim)
        }
    }
};

Grabber.prototype.getThreadJSON = function (board, thread, eightChan) {
    var self = this
    var options = {
        hostname: "a.4cdn.org",
        path: "/" + board + "/thread/" + thread + ".json",
        method: 'GET'
    }

    imageLimiter.removeTokens(1, function () {
        //console.log("Loading JSON from "+JSON.stringify(options))
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
                console.error(error.message);
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
                    //console.log(parsedData);
                    self.getImages(parsedData, eightChan)
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
    console.log("Get: " + options.host + options.path)
    dom.on("error", function (err) {
        console.log("Erroor: " + JSON.stringify(err))
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