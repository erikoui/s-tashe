// Load dependencies
const express = require('express');
const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');

const childProcess = require('child_process');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const extract = require('extract-zip');

const multer = require('multer');
const upload = multer({dest: 'uploads/'});

// eslint-disable-next-line no-unused-vars
const {nextTick} = require('process');

// Load custom modules
const {db} = require('./_helpers/db');

const Cloud = require('./_helpers/cos');
const cloud = new Cloud();

const Declutter = require('./_helpers/declutter');
const declutter = new Declutter(db, cloud);

// This is a standalone script, so just the file path is needed.
const chanDownloader = './_helpers/chan-downloader';

// Server port to listen on
const PORT = process.env.PORT || 5000;
// Image links prefix
const imgPrefixURL = `https://${process.env.COS_ENDPOINT}/${process.env.COS_BUCKETNAME}/`;

// Configure the local strategy for use by Passport.
passport.use(
    new Strategy(
        async (username, password, cb) => {
          try {
            hashPass = sha1(password);
            // we actually only need the user id from db.users.login
            // so that passport can serialize them.
            const user = await db.users.login(username, hashPass);
            if (!user) {
              return cb(null, false, {message: 'Invalid login'});
            } else {
              return cb(null, user);
            }
          } catch (e) {
            return cb(e);
          }
        },
    ));

// Configure Passport authenticated session persistence.
passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

// Define user info as req.user
passport.deserializeUser(async (id, done) => {
  try {
    let user = await db.users.findById(id);
    if (!user) {
      return done(new Error('user not found'));
    }
    const userExtras = declutter.makeRank(user);
    user = {...user, ...userExtras};
    done(null, user);
  } catch (e) {
    done(e);
  }
});

/**
 * Runs a nodejs script and listens for messages.
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
    .use(require('cookie-session')({
      secret: 'VS7nXTfOGbbvvM26',
      resave: false,
      saveUninitialized: false,
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use(declutter.errorHandler)

    .set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')

    .get('/', (req, res) => {
      db.pictures.topN(10, 10).then((top) => {
        res.render('pages/index.ejs', {
          user: req.user,
          top10: top,
          tags: declutter.tags,
          prefix: '/showImage/',
        });
      }).catch((e) => {
        console.error(e);
        res.render('pages/index.ejs', {
          user: req.user,
          top10: [],
          tags: declutter.tags,
          prefix: '/showImage/',
        });
      });
    })
    .get('/changeTagId', (req, res)=>{
      const tagId = req.query.newid;
      if (req.user) {
        db.users.changeTagId(req.user.id, tagId).then(()=>{
          res.end('Tag selection changed successfully. Go back and refresh to see the change.');
          console.log(`tag changed to ${tagId}`);
        }).catch((e)=>{
          res.end('Tag selection failed');
          console.error(`Error changing tag: ${e}`);
        });
      }
      
    })
    .get('/showImages', (req, res) => {
      db.pictures.twoRandomPics().then((data) => {
        res.json({
          image1: `https://${process.env.COS_ENDPOINT}/${process.env.COS_BUCKETNAME}/${data[0].filename}`,
          image2: `https://${process.env.COS_ENDPOINT}/${process.env.COS_BUCKETNAME}/${data[1].filename}`,
          tags1: data[0].tags,
          tags2: data[1].tags,
          id1: data[0].id,
          id2: data[1].id,
        });
      }).catch((err) => {
        res.json({
          image1: `images/a.jpg`,
          image2: `images/b.jpg`,
          tags1: [err],
          tags2: ['error'],
          id1: 1337,
          id2: 32202,
        });
        console.log(err);
      },
      );
    })
    .get('/vote', (req, res) => {
      const voteid = req.query.voteid;
      const otherid = req.query.otherid;
      let userid;
      try {
        userid = req.user.id;
      } catch (e) { }

      // Vote even if user not logged in
      db.pictures.vote(
          voteid, otherid,
      ).then((data) => {
      // Return the votes to the client
        res.json(data);
        // Add points to the user if they are logged in
        if (userid) {
          db.users.addPoints(
              userid, declutter.votePointIncrement,
          ).then((data) => {
          // console.log(data);
          }).catch((e) => {
            console.log('error increasing points: ' + e);
          });
        }
      },
      ).catch((e) => {
        console.log('error voting:' + e);
        res.end('error voting: ' + e);
      });
    })
    .get('/tag', (req, res) => {
      const tag = req.query.tag;
      db.pictures.listByTag(tag, 10)
          .then((picList) => {
            res.render('pages/tag.ejs', {
              prefix: '/showImage/',
              picList: picList,
              user: req.user,
            });
          }).catch((e) => {
            res.end(`Error while oading tag ${tag}`);
          });
    })
    .get('/login', (req, res) => {
      res.render('pages/login.ejs', {user: req.user});
    })
    .get('/register', (req, res) => {
      res.render('pages/register.ejs', {user: req.user});
    })
    .get('/download',
        ensureLoggedIn(),
        (req, res) => {
          res.end('running download script');
          // TODO: redirect to the report page when finished
          // thread is set by the url (e.g .../download?thread=https://boards.4chan.org/sp/thread/103)
          const thread = req.query.thread;
          const output = {log: [], filenames: [], tags: []};
          runScript(chanDownloader, [thread],
              (msg) => {
                // This runs each time the script calls process.send

                // Save the massage to the aproppriate JSON tag
                if (msg.log) {// log message
                  output.log.push(msg.log);
                }
                if (msg.filenames) {// chanDownloader sent a filename
                  output.filenames.push(msg.filenames);
                }
                if (msg.tags) {// chanDownloader sent a tag
                  output.tags = msg.tags;// tags is an array already
                }
              },
              (warn) => {
                // This runs each time the script calls process.emitWarning
                console.log(warn);
              },
              () => {
                // This runs when the script is done
                // This loop uploads the files to the cloud storage, while also
                // setting the filename to its md5 sum
                for (let i = 0; i < output.filenames.length; i++) {
                  // calculates MD5 of each pic  and uploads it when done
                  declutter.uploadAndUpdateDb(
                      output.filenames[i],
                      'no description',
                      output.tags,
                  );
                }

                /**
                  * Renders the output JSON file
                  */
                function renderOutput() {
                  // TODO: show a web page with proper formatting etc
                  // TODO: res.render(pages/chandownloadinfo,{status: output})
                  console.log(output);
                }

                renderOutput();
              });
        })
    .get('/upload',
        ensureLoggedIn(),
        (req, res) => {
          const userPriviledge = declutter.makeRank(req.user);
          const requiredLevel = 5;
          if (userPriviledge.level > requiredLevel) {
            res.render('pages/upload', {user: req.user});
          } else {
            res.end(`You have to be at least a \
${declutter.rankingData.ranks[requiredLevel + 1]} \
(${declutter.rankingData.pointBreaks[requiredLevel + 1]} \
points) to upload files`);
          }
        })
    .get('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    })
    .get('/admin',
        ensureLoggedIn(),
        (req, res) => {
          if (req.user.admin) {
            res.render('pages/admin', {user: req.user});
          } else {
            res.end('ok fuck off u not an admin');
          }
        })
    .get('/profile',
        ensureLoggedIn(),
        (req, res) => {
          res.render('pages/profile', {user: req.user});
        })
    .get('/deleteallfiles',
        ensureLoggedIn(),
        (req, res) => {
          if (req.user.admin) {
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
          } else {
            res.end('ok fuck off u not an admin');
          }
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
    .get('/showImage/:fn', (req, res) => {
      const filename = req.params['fn'];
      res.render('pages/showImage', {
        user: req.user,
        fn: imgPrefixURL + filename,
      });
    })
    .post('/login', passport.authenticate('local', {
      failureRedirect: '/login',
    }), async (req, res) => {
      console.log('logged in');
      res.redirect('/');
    })
    .post('/upload', upload.array('files[]'), (req, res) => {
      // Note: upload.array('files[]', <maxcount>) is also a thing
      // Uploads the files to the folder set in `const upload`.
      let err = false;
      let message = 'OK';
      for (let i = 0; i < req.files.length; i++) {
        // Add the extension to the file
        const fp = path.join(req.files[i].destination, req.files[i].filename);
        const ext = path.parse(req.files[i].originalname).ext;
        fs.renameSync(fp, fp + ext);

        if (ext == '.zip') {
          // Handle zip files
          const zipFile = path.resolve(fp+ext);
          const extractDir = path.resolve(
              path.join(
                  req.files[i].destination,
                  declutter.randomString(8),
              ),
          );
          // Extract
          extract(zipFile, {
            dir: extractDir,
          }).then(()=>{
            console.log('Extraction complete');
            // Scan uploads/zipfile folder for images
            taggedFiles=declutter.scanAndTag(extractDir);

            // Upload images and delete them after they are uploaded
            for (let i=0; i<taggedFiles.length; i++) {
              declutter.uploadAndUpdateDb(
                  taggedFiles[i].filename,
                  'No description',
                  taggedFiles[i].tags,
                  true,
              );
            }

            // Delete zip file
            fs.unlink(fp+ext, ()=>{
              console.log('Zip file deleted from local');
            });
          }).catch((e)=>{
            console.error(e);
          });
        } else if ((/\.(gif|jpe?g|tiff?|png|webp|bmp|webm)$/i).test(ext)) {
          // Handle images
          declutter.uploadAndUpdateDb(
              fp+ext,
              req.files[i].originalname,
              [],
              true,
          );
        } else {
          // Error
          console.log('unhandled file uploaded');
          err = true;
          message = 'unknown file extension for some files';
        }
      }

      // Tell the frontend what happened
      res.json({
        success: !err,
        error: message,
      });
    })
    .post('/register', (req, res) => {
      const hashedPass = sha1(req.body.password);
      db.users.add(req.body.username, hashedPass).then(() => {
        res.redirect('/login');
      }).catch((e) => {
        console.log(e);
        res.redirect('/register');
      });
    })

    .listen(PORT, () => console.log(`Listening on ${PORT}`));

