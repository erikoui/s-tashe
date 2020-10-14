const express = require('express')
const path = require('path')
const { db } = require('./db');
var childProcess = require('child_process');
const passport = require('passport'), Strategy = require('passport-local').Strategy;
const errorHandler = require('./_helpers/error-handler')

const chanDownloader = './_helpers/chan-downloader'
const PORT = process.env.PORT || 5000

// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  async function (username, password, cb) {
    //db.users.testDb();
    let user;
    try {
      user = await db.users.findByName(username);
      if (!user) {
        console.log("Invalid login")
        return cb(null, false, { message: 'No user by that name' });
      }
    } catch (e) {
      return cb(e);
    }
    console.log("Found user "+user.uname)
    return cb(null, user)
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

//TODO: fix communication between script and main function (callback methodology)
function runScript(scriptPath, args, callback) {
  // keep track of whether callback has been invoked to prevent multiple invocations
  var invoked = false;
  var process = childProcess.fork(scriptPath, args);
  var output = ''

  // listen for errors as they may prevent the exit event from firing
  process.on('error', function (err) {
    if (invoked) return;
    invoked = true;
    callback(err);
  });

  //listen for general messages
  process.on('message', function (data) {
    if (invoked) return;
    output.concat(data)
  });
  // execute the callback once the process has finished running
  process.on('exit', function (code) {
    if (invoked) return;
    invoked = true;
    var err = code === 0 ? null : new Error('exit code ' + code);
    callback(output);
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

    runScript(chanDownloader, [thread], function (err) {
      //err is a json object returned from chan-downoader.js
      //TODO: res.render(pages/chandownloaderoutput,{status: err}) or something
      res.end('Output:\n' + JSON.stringify(err));
    });

  })
  //TODO: fix this, it redirects when username incorrect, but does not login on username correct.
  .post('/login', passport.authenticate('local', { failureRedirect: '/login' }),async (req, res) => {
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

