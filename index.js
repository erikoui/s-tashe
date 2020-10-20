const express = require('express');
const path = require('path');
const {db} = require('./db');
const md5File = require('md5-file');
const childProcess = require('child_process');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const errorHandler = require('./_helpers/error-handler');

// /////////////IBM COS////////////////////
const Cloud = require('./cos');
cloud = new Cloud();
// ////////////////////////////////////////

const chanDownloader = './_helpers/chan-downloader';
const PORT = process.env.PORT || 5000;

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
    async (username, password, cb) => {
    // db.users.testDb();
      let user;
      try {
        user = await db.users.findByName(username);
        if (!user) {
          console.log('Invalid login');
          return cb(null, false, {message: 'No user by that name'});
        }
      } catch (e) {
        return cb(e);
      }
      console.log('Found user ' + user.uname);
      return cb(null, user);
    },
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
    const user = await db.users.findById(id);
    if (!user) {
      return done(new Error('user not found'));
    }
    done(null, user);
  } catch (e) {
    done(e);
  }
});

/**
 *
 * @param {string} scriptPath
 * @param {array<any>} args
 * @param {Function} messagecb - callback on message from process.send
 * @param {Function} warningcb - callback on warning from process.emitWarning
 * @param {Function} donecb - callback on finish
 */
function runScript(scriptPath, args, messagecb, warningcb, donecb) {
  // Keep track of invocations to prevent multiple of them
  let invoked = false;

  // Run the script
  const process = childProcess.fork(scriptPath, args);

  // listen for errors as they may prevent the exit event from firing
  process.on('warning', (err) => {
    warningcb(err);
  });

  // listen for general messages (from process.send)
  process.on('message', (data) => {
    if (data) {
      messagecb(data);
    }
  });

  // execute the messagecb once the process has finished running
  process.on('exit', (code) => {
    if (invoked) {
      return;
    }
    invoked = true;
    if (code !== 0) {
      throw new Error(`Process ${scriptPath} error with exit code ${code}`);
    }
    donecb();
  });
}

express()
    .use(express.static(path.join(__dirname, 'public')))
    .use(require('morgan')('combined'))
    .use(require('body-parser').urlencoded({extended: true}))
    .use(require('express-session')({
      secret: 'benis_shabenis', // TODO: find out what 'secret' is here
      resave: false,
      saveUninitialized: false,
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use(errorHandler)

    // this is the folder with all the ejs files
    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')

    .get('/', (req, res) => {
      res.render('pages/index.ejs', {user: req.user});
    })
    .get('/showImages', (req, res) => {
      db.pictures.twoRandomPics().then((data) => {
        console.log(data);
        res.render('partials/showImages.ejs', {
          image1: `https://${process.env.COS_ENDPOINT}/${process.env.COS_BUCKETNAME}/${data[0].filename}`,
          image2: `https://${process.env.COS_ENDPOINT}/${process.env.COS_BUCKETNAME}/${data[1].filename}`,
          // TODO: generate this tag object from the database
          tags: [{id: 1, tag: 'test'}, {id: 2, tag: 'banei'}],
        });
      }).catch((err) => {
        // TODO: remove this render statement, its for testing only
        // Or don't, and show 2 local images and the error.
        res.render('partials/showImages.ejs', {
          image1: 'images/a.jpg',
          image2: 'images/b.jpg',
          tags: [{id: 1, tag: 'test'}, {id: 2, tag: 'banei'}],
        });
        // res.end('Error fetching images: ' + err);
      },
      );
    })
    .get('/login', (req, res) => {
      res.render('pages/login.ejs', {user: req.user});
    })
    .get('/download', (req, res) => {
      res.end('running download script');
      // thread is set by the url (e.g .../download?thread=https://boards.4chan.org/sp/thread/103)
      const thread = req.query.thread;
      const output = {log: [], filenames: [], tags: [], tagids: []};
      runScript(chanDownloader, [thread],
          (msg) => {
            // This runs each time the script calls process.send

            // Save the massage to the approptiate JSON tag
            if (msg.log) {// log message
              output.log.push(msg.log);
            }
            if (msg.filenames) {// chanDownloader sent a filename
              output.filenames.push(msg.filenames);
            }
            if (msg.tags) {// chanDownloader sent a tag
              output.tags = msg.tags;// tags is an array already
              output.tagids = msg.tagids;
            }
          },
          (warn) => {
            // This runs each time the script calls process.emitWarning
            console.log(warn);
          },
          () => {
            // This runs when the script is done

            /**
             * Inserts image info and tags it in the database.
             * @param {strint} filename - filename as in the cloud
             *  (the md5 name). Also known as the key
             * @param {array<int>} tagids - tag ids
             */
            async function updateDb(filename, tagids) {
              const desc = 'No description';
              try {
                const picRecord = await db.pictures.add(desc, filename);
                console.log(picRecord);
                for (let i = 0; i < tagids.length; i++) {
                  if (tagids[i]) {
                    try {
                      await db.picTags.tagImage(picRecord.id, tagids[i]);
                    } catch (e) {
                      console.log(`error tagging image: ${e}`);
                    }
                  }
                }
              } catch (e) {
                console.log(`error uploading image: ${e}`);
              }
            }

            /**
             * Renders the output JSON file
             */
            function renderOutput() {
              // TODO: show a web page with proper formatting etc
              // TODO: res.render(pages/chandownloaderoutput,{status: output})
              console.log(output);
            }

            // This loop uploads the files to the cloud storage, while also
            // setting the filename to its md5 sum
            for (let i = 0; i < output.filenames.length; i++) {
              // calculates MD5 of each pic  and uploads it when done
              const filePath = path.join(output.filenames[i]);
              console.log(`calculating md5: ${filePath}`);
              md5File(filePath).
                  then(async (md5) => {
                    console.log(`file md5: ${md5}`);
                    const ext = path.parse(filePath).ext;
                    const cloudname = md5 + ext;
                    await cloud.simpleUpload(md5 + ext, filePath);
                    await updateDb(cloudname, output.tagids);
                    console.log('Upload successful');
                    output.log.push('Upload successful');
                  }).catch((reason) => {
                    console.log(`error while uploading to cloud:${reason}`);
                  });
            }

            renderOutput();
          });
    })
    .get('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    })
    .get('/admin',
        require('connect-ensure-login').ensureLoggedIn(),
        (req, res) => {
          res.render('pages/admin', {user: req.user});
        })
    .get('/profile',
        require('connect-ensure-login').ensureLoggedIn(),
        (req, res) => {
          res.render('pages/profile', {user: req.user});
        })
    .get('/deleteallfiles', (req, res) => {
      cloud.getBucketContents(
      ).then(async (data) => {
        console.log(data);
        const filenames = [];
        for (let i = 0; i < data.Contents.length; i++) {
          filenames.push(data.Contents[i].Key);
        }
        await cloud.deleteItems(filenames);
        res.end(filenames.toString());
      }).catch((err) => {
        console.log('error getting item list from cos:' + err);
        res.end(`Error: ${err}`);
      });
    })
    .get('/listallfiles', (req, res) => {
      cloud.getBucketContents(
      ).then((data) => {
        const filenames = [];
        for (let i = 0; i < data.Contents.length; i++) {
          filenames.push(data.Contents[i].Key);
        }
        res.end(filenames.toString());
      }).catch((err) => {
        console.log('error getting item list from cos:' + err);
        res.end(`Error: ${err}`);
      });
    })

    .post('/login', passport.authenticate('local', {
      failureRedirect: '/login',
    }), async (req, res) => {
      console.log('logged in');
      res.redirect('/');
    })

    .listen(PORT, () => console.log(`Listening on ${PORT}`));

