// Load dependencies
const express = require('express');
const fs = require('fs');
const path = require('path');
const sha1 = require('sha1');
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

const ChanParser = require('./_helpers/chan-parser');
const chanParser = new ChanParser();

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

// Set up 4chan scanner to run every 24 hrs
setInterval(
    () => {
      chanParser.loadBoardJson('/s/').then((data) => {
        for (let i = 0; i < data.length; i++) {
          declutter.imageLimiter.removeTokens(1, () => {
            declutter.downloadThreadAndSaveToCloud(data[i]).then(() => {
            }).catch((e) => {
              console.error(e);
              console.error('error with download thread:' + e);
            });
          });
        }
      }).catch((e) => {
        console.error('error with loadBoardJson: ' + e);
      });
    },
    24 * 60 * 60 * 1000,
);

app = express();

// ------------ init ------------
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('cookie-session')({
  secret: 'VS7nXTfOGbbvvM26',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(declutter.errorHandler);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ------------ Load views ------------
app.get('/', (req, res) => {
  db.pictures.topN(10, 3).then((top) => {
    res.render('pages/index.ejs', {
      user: req.user,
      top10: top,
      tags: declutter.tags,
      prefix: '/showImage/',
      rankingData: declutter.rankingData,
    });
  }).catch((e) => {
    console.error(e);
    res.render('pages/index.ejs', {
      user: req.user,
      top10: [],
      tags: declutter.tags,
      prefix: '/showImage/',
      rankingData: declutter.rankingData,
    });
  });
});
app.get('/tag', (req, res) => {
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
});
app.get('/login', (req, res) => {
  res.render('pages/login.ejs', {user: req.user});
});
app.get('/register', (req, res) => {
  res.render('pages/register.ejs', {user: req.user});
});
app.get('/upload',
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
    });
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
app.get('/admin',
    ensureLoggedIn(),
    (req, res) => {
      if (req.user.admin) {
        res.render('pages/admin', {user: req.user});
      } else {
        res.end('ok fuck off u not an admin');
      }
    });
app.get('/profile',
    ensureLoggedIn(),
    (req, res) => {
      res.render('pages/profile', {user: req.user});
    });
app.get('/showImage/:fn', (req, res) => {
  const filename = req.params['fn'];
  res.render('pages/showImage', {
    user: req.user,
    fn: imgPrefixURL + filename,
  });
});
app.get('/edittags', ensureLoggedIn(),
    (req, res) => {
      const userPriviledge = declutter.makeRank(req.user);
      const requiredLevel = 3;
      if (userPriviledge.level > requiredLevel) {
        db.pictures.getTagsById(req.query.picid).then((imgData) => {
          res.render('pages/edittags', {
            picid: req.query.picid,
            user: req.user,
            fn: imgPrefixURL + imgData.filename,
            description: imgData.description,
            tags: imgData.tags,
            alltags: declutter.tags,
          });
        });
      } else {
        res.end(`You have to be at least a \
${declutter.rankingData.ranks[requiredLevel + 1]} \
(${declutter.rankingData.pointBreaks[requiredLevel + 1]} \
points) to change tags`);
      }
    });
app.get('/report', ensureLoggedIn(),
    (req, res) => {
      const userPriviledge = declutter.makeRank(req.user);
      const requiredLevel = 2;
      if (userPriviledge.level > requiredLevel) {
        db.pictures.getTagsById(req.query.picid).then((imgData) => {
          res.render('pages/report', {
            picid: req.query.picid,
            user: req.user,
            fn: imgPrefixURL + imgData.filename,
            description: imgData.description,
            tags: imgData.tags,
            votes: imgData.votes,
            views: imgData.views,
            alltags: declutter.tags,
          });
        });
      } else {
        res.end(`You have to be at least a \
${declutter.rankingData.ranks[requiredLevel + 1]} \
(${declutter.rankingData.pointBreaks[requiredLevel + 1]} \
points) to change tags`);
      }
    });
app.get('/showreports',
    ensureLoggedIn(),
    (req, res) => {
      if (req.user.admin) {
        db.reports.all().then((data) => {
          res.render('pages/reportlist', {
            user: req.user,
            data: data,
          });
        }).catch((e) => {
          res.end(e);
        });
      } else {
        res.end('fk off no admin');
      }
    });

// ----------- API calls ----------
app.get('/getreports',
    ensureLoggedIn(),
    (req, res) => {
      if (req.user.admin) {
        db.reports.getByPicId(req.query.picid).then((data) => {
          res.json(data);
        }).catch((e) => {
          res.json({
            err: true,
            message: 'Error:' + e,
          });
        });
      }
    });
app.get('/removereports',
    ensureLoggedIn(),
    (req, res) => {
      if (req.user.admin) {
        db.reports.deleteByPicId(req.query.picid).then((data) => {
          res.json({
            err: false,
            message: data.length + 'Reports deleted:',
          });
        }).catch((e) => {
          res.json({
            err: true,
            message: 'Error:' + e,
          });
        });
      }
    });
app.get('/addTag', ensureLoggedIn(),
    (req, res) => {
      const userPriviledge = declutter.makeRank(req.user);
      const requiredLevel = 3;
      if (userPriviledge.level > requiredLevel) {
        let validTag = false;
        for (let i = 0; i < declutter.tags.length; i++) {
          if (req.query.tag == declutter.tags[i].tag) {
            validTag = true;
            break;
          }
        }
        if (validTag) {
          db.pictures.addTag(req.query.picid, req.query.tag).then(() => {
            res.json({
              err: false,
              message: 'Tag ' + req.query.tag + ' added.',
            }).catch((e) => {
              res.json({
                err: true,
                message: 'Database error: ' + e,
              });
            });
          });
        } else {
          res.json({
            err: true,
            message: 'Insufficient priviledges',
          });
        }
      } else {
        res.json({
          err: true,
          message: 'Invalid tag',
        });
      }
    });
app.get('/removeTag', ensureLoggedIn(),
    (req, res) => {
      const userPriviledge = declutter.makeRank(req.user);
      const requiredLevel = 3;
      if (userPriviledge.level > requiredLevel) {
        let validTag = false;
        for (let i = 0; i < declutter.tags.length; i++) {
          if (req.query.tag == declutter.tags[i].tag) {
            validTag = true;
            break;
          }
        }
        if (validTag) {
          db.pictures.removeTag(req.query.picid, req.query.tag).then(() => {
            res.json({
              err: false,
              message: 'Tag ' + req.query.tag + ' removed.',
            });
          }).catch((e) => {
            res.json({
              err: true,
              message: 'Database error: ' + e,
            });
          });
        } else {
          res.json({
            err: true,
            message: 'Insufficient priviledges',
          });
        }
      } else {
        res.json({
          err: true,
          message: 'Invalid tag',
        });
      }
    });
app.get('/deleteallfiles',
    ensureLoggedIn(),
    (req, res) => {
      if (req.user.admin) {
        cloud.getBucketContents().then(async (data) => {
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
    });
app.get('/cleanupdb',
    ensureLoggedIn(),
    (req, res) => {
      if (req.user.admin) {
        cloud.getBucketContents().then((data) => {
          const filenames = [];
          for (let i = 0; i < data.Contents.length; i++) {
            filenames.push(data.Contents[i].Key);
          }
          db.pictures.cleanup(filenames);
        }).catch((err) => {
          console.log('error getting item list from cos:' + err);
          res.end(`Error: ${err}`);
        });
        res.end('done');
      } else {
        res.end('ok fuck off u not an admin');
      }
    });
app.get('/listallfiles', (req, res) => {
  cloud.getBucketContents().then((data) => {
    const filenames = [];
    for (let i = 0; i < data.Contents.length; i++) {
      filenames.push(data.Contents[i].Key);
    }
    res.end(`${filenames.toString()}
${filenames.length} total files`);
  }).catch((err) => {
    console.log('error getting item list from cos:' + err);
    res.end(`Error: ${err}`);
  });
});
app.get('/download',
    ensureLoggedIn(),
    (req, res) => {
      // TODO: return a JSON object or a stream
      if (req.user.admin) {
        res.end('running download script');
        // TODO: redirect to the report page when finished
        declutter.downloadThreadAndSaveToCloud(
            req.query.thread,
        ).then((output) => {
          console.log(output);
        }).catch((e) => {
          console.error(e);
        });
      } else {
        req.end('fk offf u not admin');
      }
    });
app.get('/changeTagId', (req, res) => {
  const tagId = req.query.newid;
  if (req.user) {
    db.users.changeTagId(req.user.id, tagId).then(() => {
      res.json({
        message: 'Tag changed',
        error: false,
      });
      console.log(`Tag changed to ${tagId}`);
    }).catch((e) => {
      res.json({
        message: `Tag change failed: ${e}`,
        error: true,
      });
      console.error(`Error changing tag: ${e}`);
    });
  } else {
    res.json({
      message: 'Not logged in',
      error: true,
    });
  }
});
app.get('/showImages', (req, res) => {
  let selectedTag = 2;
  if (req.user) { // if logged in, load the users' selected tag
    selectedTag = req.user.selectedtag;
  }
  db.pictures.twoRandomPics(selectedTag).then((data) => {
    res.json({
      images: [
        `${imgPrefixURL}${data[0].filename}`,
        `${imgPrefixURL}${data[1].filename}`,
      ],
      tags: [
        data[0].tags,
        data[1].tags,
      ],
      ids: [
        data[0].id,
        data[1].id,
      ],
      desc: [
        data[0].desc,
        data[1].desc,
      ],
    });
  }).catch((err) => {
    res.json({
      images: [
        `images/a.jpg`,
        `images/b.jpg`,
      ],
      tags: [
        ['Database error'],
        [err.message],
      ],
      ids: [
        34543534,
        46346346,
      ],
      desc: [
        'err',
        'or',
      ],
    });
    console.error(err);
  });
});
app.get('/vote', (req, res) => {
  // TODO: return a json response
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
  }).catch((e) => {
    console.log('error voting:' + e);
    res.end('error voting: ' + e);
  });
});
app.get('/deletePic',
    ensureLoggedIn(),
    (req, res) => {
      if (req.user.admin) {
        db.pictures.deleteById(req.query.id).then((rec) => {
          console.log(rec);
          cloud.deleteItems([rec[0].filename]).then(() => {
            console.log('file deleted from cloud.');
            res.json({
              err: false,
              message: 'probably deleted file, errors dont get passed lol',
            });
          }).catch((e) => {
            console.error(e);
          });
        }).catch((e) => {
          console.error(e);
        });
      } else {
        res.json({
          err: true,
          message: 'not an admin',
        });
      }
    });

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
}), async (req, res) => {
  console.log('logged in');
  res.redirect('/');
});
app.post('/upload', upload.array('files[]'), (req, res) => {
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
      const zipFile = path.resolve(fp + ext);
      const extractDir = path.resolve(
          path.join(
              req.files[i].destination,
              declutter.randomString(8),
          ),
      );
      // Extract
      extract(zipFile, {
        dir: extractDir,
      }).then(() => {
        console.log('Extraction complete');
        // Scan uploads/zipfile folder for images
        taggedFiles = declutter.scanAndTag(extractDir);

        // Upload images and delete them after they are uploaded
        for (let i = 0; i < taggedFiles.length; i++) {
          declutter.uploadAndUpdateDb(
              taggedFiles[i].filename,
              'No description',
              taggedFiles[i].tags,
              true,
          );
        }

        // Delete zip file
        fs.unlink(fp + ext, () => {
          console.log('Zip file deleted from local');
        });
      }).catch((e) => {
        console.error(e);
      });
    } else if ((/\.(gif|jpe?g|tiff?|png|webp|bmp|webm)$/i).test(ext)) {
      // Handle images
      declutter.uploadAndUpdateDb(
          fp + ext,
          req.files[i].originalname, [],
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
});
app.post('/register', (req, res) => {
  const hashedPass = sha1(req.body.password);
  db.users.add(req.body.username, hashedPass).then(() => {
    res.redirect('/login');
  }).catch((e) => {
    console.log(e);
    res.redirect('/register');
  });
});
app.post('/report', ensureLoggedIn(),
    (req, res) => {
      const userPriviledge = declutter.makeRank(req.user);
      const requiredLevel = 2;
      if (userPriviledge.level > requiredLevel) {
        db.reports.add(
            req.body.rtype,
            req.body.details,
            req.body.picid,
            req.user.id,
            req.user.uname,
            req.body.suggestedfix,
        ).then(() => {
          res.json({
            error: false,
            message: 'Report submitted',
          });
        }).catch((e) => {
          res.json({
            error: true,
            message: 'Failed' + e,
          });
        });
      }
    });
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
