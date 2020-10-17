const express = require('express')
const path = require('path')
const { db } = require('./db');
const fs = require("fs")
const md5File = require('md5-file')
const childProcess = require('child_process');
const passport = require('passport'), Strategy = require('passport-local').Strategy;
const errorHandler = require('./_helpers/error-handler');

///////////////IBM COS////////////////////
const Cloud = require('./cos');
cloud = new Cloud()
//////////////////////////////////////////

const chanDownloader = './_helpers/chan-downloader'
const PORT = process.env.PORT || 5000

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  async (username, password, cb) => {
    //db.users.testDb();
    let user;
    try {
      user = await db.users.findByName(username);
      if (!user) {
        console.log("Invalid login");
        return cb(null, false, { message: 'No user by that name' });
      }
    } catch (e) {
      return cb(e);
    }
    console.log("Found user " + user.uname);
    return cb(null, user);
  }
));

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user = await db.users.findById(id);
    if (!user) {
      return done(new Error('user not found'));
    }
    done(null, user);
  } catch (e) {
    done(e);
  }
});

function runScript(scriptPath, args, messagecb, warningcb, donecb) {
  // keep track of whether messagecb has been invoked to prevent multiple invocations
  var invoked = false;
  var process = childProcess.fork(scriptPath, args);

  // listen for errors as they may prevent the exit event from firing
  process.on('warning', (err) => {
    warningcb(err);
  });

  //listen for general messages (from process.send)
  process.on('message', (data) => {
    if (data)
      messagecb(data);
  });

  // execute the messagecb once the process has finished running
  process.on('exit', (code) => {
    if (invoked)
      return;
    invoked = true;
    var err = code === 0 ? null : new Error('exit code ' + code);
    donecb();
  });

}

express()
  .use(express.static(path.join(__dirname, 'public')))//this is the folder with all resources
  .set('views', path.join(__dirname, 'views'))//this is the folder with all the ejs files
  .use(require('morgan')('combined'))
  .use(require('body-parser').urlencoded({ extended: true }))
  .use(require('express-session')({ secret: 'benis_shabenis', resave: false, saveUninitialized: false }))
  .use(passport.initialize())
  .use(passport.session())
  .use(errorHandler)
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index.ejs', { user: req.user }))
  .get('/login', (req, res) => res.render('pages/login.ejs', { user: req.user }))
  .get('/download', (req, res) => {
    //thread is set by the url (e.g .../download?thread=https://boards.4chan.org/sp/thread/103)
    let thread = req.query.thread
    let output = { log: [], filenames: [], tags: [], tagids: [] }
    runScript(chanDownloader, [thread],
      (msg) => {
        //This runs each time the script calls process.send

        //Save the massage to the approptiate JSON tag
        if (msg.log)//log message
          output.log.push(msg.log);
        if (msg.filenames)//chanDownloader sent a filename 
          output.filenames.push(msg.filenames);
        if (msg.tags) {//chanDownloader sent a tag
          output.tags = msg.tags//tags is an array already
          output.tagids = msg.tagids
        }
      },
      (warn) => {
        //This runs each time the script calls process.emitWarning
        console.log(warn)
      },
      () => {
        //This will get run after the script has finished

        //upload is done in a separate function for readability
        async function upload(filePath, md5) {
          let ext = path.parse(filePath).ext;
          await cloud.simpleUpload(md5 + ext, filePath);
          return md5 + ext
        }

        function updatedb(fn) {
          //TODO: Implement this idea in the db repo files (pictures.add and pic_tag.addTagToPic)
          // picjson = {
          //   filename: fn,
          //   description: "No description",
          // }
          // picid = db.pictures.add(picjson);
          // db.pic_tag.addTagToPic(tagid, picid);
        }

        //rendering the output JSON file is done in a separate function for readability
        function renderOutput() {
          //TODO: res.render(pages/chandownloaderoutput,{status: output}) or something
          console.log(output)
          for (var i = 0; i < output.log.length; i++) {
            if (output.log[i])//ignore undefined so that the server doesnt crash
              res.write(output.log[i] + "\n")
          }
          res.end()
        }

        //This loop uploads the files to the cloud storage, while also setting the filename to its md5 sum
        for (var i = 0; i < output.filenames.length; i++) {
          //calculates MD5 of each pic asynchronously and uploads it when done, to prevent duplicate file uploads
          //DO NOT CHANGE CONST. IT ENSURES FILEPATH IS PASSED TO THE .then()
          const filePath = path.join(output.filenames[i])
          md5File(filePath).
            then((md5) => {
              upload(filePath, md5).then((cloudname) => {
                updatedb(cloudname)//TODO-ish:adds a record to the pictures table with the filename, and records to the tag table with tags.
                console.log("Upload successful")
                output.log.push("Upload successful")
              })
                .catch((reason) => {
                  console.log("error in file upload promise: " + reason)
                })
            })
            .catch((reason) => {
              console.log("error with md5 while uploading to cloud:" + reason)
            })
        }

        renderOutput();
      })
  })
  //TODO: fix this, it redirects when username incorrect, but does not login on username correct.
  .post('/login', passport.authenticate('local', { failureRedirect: '/login' }), async (req, res) => {
    console.log("logged in")
    res.redirect('/');
  })
  .get('/logout',
    (req, res) => {
      req.logout();
      res.redirect('/');
    })
  .get('/admin', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    res.render('pages/admin', { user: req.user });
  })
  .get('/profile', require('connect-ensure-login').ensureLoggedIn(), (req, res) => {
    res.render('pages/profile', { user: req.user });
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

