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
const favicon=require('serve-favicon');
const cookieParser = require('cookie-parser');

// Load custom modules
const {db} = require('./_helpers/db');

const Cloud = require('./_helpers/cos');
const cloud = new Cloud();

const Declutter = require('./_helpers/declutter');
const declutter = new Declutter(db, cloud);

const ChanParser = require('./_helpers/chan-parser');
const chanParser = new ChanParser();

const PgService = require('./_helpers/postgresql-service.ts');
const pgService = new PgService;
const session = require('express-session');

// Server port to listen on
const PORT = process.env.PORT || 5000;
// Image links prefix
const imgPrefixURL = declutter.imgPrefixURL;

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

// Set up 4chan scanner to run every 58 mins, and right after server start
chinScanner=() => {
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
};
// chinScanner();
// setInterval(chinScanner, 58 * 60 * 1000);

// update the archive pictures every 6 hrs
setInterval(declutter.updateArchivePicList, 6*60*60*1000);

app = express();
// ------------ init middlewares ------------
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));
app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({extended: true}));
app.use(session({
  store: pgService.sessionHandler(session),
  secret: process.env.SESSION_SECRET,
  saveUninitialized: false,
  resave: false,
  unset: 'destroy',
  cookie: {
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: false,
  },
}));
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(declutter.errorHandler);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ------------ Load views ------------
app.get('/', (req, res) => {
  let cookieTag=2;
  console.log('Cookies: ', req.cookies);
  if (!req.cookies.selectedTag) {
    res.cookie('selectedTag', 2, {
      maxAge: 60 * 60 * 24 * 30, // 1 month
    });
    console.log('No cookies found, made one');
  } else {
    console.log('Got selected tag from cookie:'+req.cookies.selectedTag);
    cookieTag=req.cookies.selectedTag;
  }
  // db.pictures.topN(10, 3).then((top) => {
  res.render('pages/index.ejs', {
    user: req.user,
    cookieTag: cookieTag,
    tags: declutter.tags,
    prefix: '/edittags/',
    rankingData: declutter.rankingData,
  });
  // }).catch((e) => {
  //   console.error(e);
  //   res.render('pages/index.ejs', {
  //     user: req.user,
  //     cookieTag: declutter.cookieTag,
  //     top10: [],
  //     tags: declutter.tags,
  //     prefix: '/edittags/',
  //     rankingData: declutter.rankingData,
  //   });
  // });
});
app.get('/tag', (req, res) => {
  const tag = req.query.tag;
  db.pictures.listByTag(tag, 10)
      .then((picList) => {
        res.render('pages/tag.ejs', {
          prefix: '/edittags/',
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
app.get('/upload', ensureLoggedIn(), declutter.checkLevel(6, false),
    (req, res) => {
      res.render('pages/upload', {user: req.user});
    });
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});
app.get('/admin', ensureLoggedIn(), declutter.checkLevel(10, false),
    (req, res) => {
      res.render('pages/admin', {user: req.user});
    });
app.get('/profile', ensureLoggedIn(), (req, res) => {
  res.render('pages/profile', {user: req.user});
});
app.get('/edittags',
    (req, res) => {
      res.render('pages/edittags', {
        picid: req.query.picid,
        user: req.user,
      });
    });
app.get('/archive', (req, res)=>{
  res.render('pages/archive', {
    user: req.user,
  });
});
app.get('/report', ensureLoggedIn(), declutter.checkLevel(2, false),
    (req, res) => {
      db.pictures.getPicDataById(req.query.picid).then((imgData) => {
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
    });
app.get('/showreports', ensureLoggedIn(), declutter.checkLevel(10, false),
    (req, res) => {
      db.reports.all().then((data) => {
        res.render('pages/reportlist', {
          user: req.user,
          data: data,
        });
      }).catch((e) => {
        res.end(e);
      });
    });

// ----------- API calls ----------
app.get('/API/getPicData', (req, res)=>{
  db.pictures.getPicDataById(req.query.picid).then((imgData) => {
    res.json({
      err: false,
      picid: req.query.picid,
      fn: imgPrefixURL + imgData.filename,
      description: imgData.description,
      tags: imgData.tags,
      alltags: declutter.tags,
    });
  }).catch((e)=>{
    res.json({
      err: true,
      message: e.message,
    });
  });
});
app.get('/API/getReports', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res) => {
      db.reports.getByPicId(req.query.picid).then((data) => {
        res.json(data);
      }).catch((e) => {
        res.json({
          err: true,
          message: 'Error:' + e,
        });
      });
    });
// eslint-disable-next-line max-len
app.get('/API/changeDescription', declutter.checkLevel(5, true), ensureLoggedIn(),
    (req, res)=>{
      db.pictures.changeDesc(req.query.picid, req.query.newdesc).then((data)=>{
        res.json({
          err: false,
          message: 'OK:'+data.description,
        });
      }).catch((e)=>{
        res.json({
          err: true,
          message: e.message,
        });
      });
    });
app.get('/API/removereports', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res) => {
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
    });
app.get('/API/addTag', declutter.checkLevel(3, true), ensureLoggedIn(),
    (req, res) => {
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
          message: 'Invalid tag',
        });
      }
    });
app.get('/API/removeTag', declutter.checkLevel(3, true), ensureLoggedIn(),
    (req, res) => {
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
          message: 'Invalid tag',
        });
      }
    });
app.get('/API/deleteallfiles', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res) => {
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
    });
app.get('/API/cleanupdb', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res) => {
      cloud.getBucketContents().then((data) => {
        const filenames = [];
        for (let i = 0; i < data.Contents.length; i++) {
          filenames.push(data.Contents[i].Key);
        }
        db.pictures.cleanup(filenames);
      }).catch((err) => {
        console.log('error getting item list from cos:' + err);
        res.json({
          err: true,
          message: err,
        });
      });
      res.json({
        err: false,
        message: 'Done',
      });
    });
app.get('/API/listallfiles', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res) => {
      cloud.getBucketContents().then((data) => {
        const filenames = [];
        for (let i = 0; i < data.Contents.length; i++) {
          filenames.push(data.Contents[i].Key);
        }
        res.json({
          err: false,
          data: filenames,
          message: `${filenames.length} total files`,
        });
      }).catch((err) => {
        console.log(`error getting item list from cos: ${err}`);
        res.json({
          err: true,
          data: [],
          message: `error getting item list from cos: ${err}`,
        });
      });
    });
app.get('/API/download', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res) => {
    // TODO: return a JSON object or a stream

      declutter.downloadThreadAndSaveToCloud(
          req.query.thread,
      ).then((output) => {
        console.log(output);
      }).catch((e) => {
        console.error(e);
      });
      res.end('running download script');
    });
app.get('/API/changeTagId', (req, res) => {
  const tagId = req.query.newid;
  res.cookie('selectedTag', tagId, {
    maxAge: 60 * 60 * 24 * 30, // 1 month
  });
  if (req.user) {
    db.users.changeTagId(req.user.id, tagId).then(() => {
      res.json({
        message: 'Tag changed',
        err: false,
      });
      console.log(`Tag changed to ${tagId}`);
    }).catch((e) => {
      res.json({
        message: `Tag change failed: ${e}`,
        err: true,
      });
      console.error(`Error changing tag: ${e}`);
    });
  } else {
    res.json({
      message: 'Tag changed in cookie',
      err: false,
    });
    console.log(`Tag changed to ${tagId} (via cookie)`);
  }
});
app.get('/API/getTwoRandomPics', (req, res) => {
  let selectedTag = 2;
  if (req.user) { // if logged in, load the users' selected tag
    selectedTag = req.user.selectedtag;
  } else {
    console.log(req.cookies.selectedTag);
    selectedTag = (req.cookies.selectedTag?req.cookies.selectedTag:2);
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
app.get('/API/vote', (req, res) => {
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
    res.json({
      err: false,
      data: data,
      message: 'Voted OK',
    });
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
    res.json({
      err: true,
      data: {},
      message: 'Database error: ' + e,
    });
  });
});
app.get('/API/deletePic', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res) => {
      db.pictures.deleteById(req.query.picid).then((rec) => {
        console.log('file deleted from db');
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
    });
app.get('/API/getBestEachTag', (req, res)=>{
  res.json({
    images: declutter.archivePicList,
  });
});
app.get('/API/updateArchive', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res)=>{
      declutter.updateArchivePicList().then(()=>{
        res.end('OK');
      }).catch((e)=>{
        res.end(e.message);
      });
    });
app.get('/API/scan4chan', ensureLoggedIn(), declutter.checkLevel(10, true),
    (req, res)=>{
      chinScanner();
      res.end('Scanning 4chan for threads now.');
    });
app.get('/API/getLeaderboards', (req, res)=>{
  const minVotes=req.query.minvotes?req.query.minvotes:declutter.minVotes;
  const numLeaders=req.query.n;
  const tag=req.query.tag;
  if (tag) {
    db.pictures.topNandTag(numLeaders, minVotes, tag).then((top) => {
      res.json({
        err: false,
        message: '',
        top: top,
      });
    }).catch((e) => {
      console.error(e);
      res.json({
        err: false,
        message: e.message,
        top: top,
      });
    });
  } else {
    db.pictures.topN(numLeaders, minVotes).then((top) => {
      res.json({
        err: false,
        message: '',
        top: top,
      });
    }).catch((e) => {
      console.error(e);
      res.json({
        err: false,
        message: e.message,
        top: top,
      });
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
app.post('/report', ensureLoggedIn(), declutter.checkLevel(2, true),
    (req, res) => {
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
          message: 'Failed: ' + e,
        });
      });
    });
app.post('/API/changeUsername', ensureLoggedIn(), (req, res) => {
  db.users.changeUsername(req.user.id, req.body.uname).then(() => {
    res.redirect('/');
  }).catch((e) => {
    console.log(e);
    res.redirect('/profile');
  });
});
app.post('/API/changePassword', ensureLoggedIn(), (req, res) => {
  const oldPassHash = sha1(req.body.cpass);
  const newPassHash = sha1(req.body.npass);
  db.users.changePassword(req.user.id, oldPassHash, newPassHash).then(() => {
    res.redirect('/logout');
  }).catch((e) => {
    console.log(e);
    res.render('pages/wrongpass', {user: req.user});
  });
});

// --------------- Start Server ----------------
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
