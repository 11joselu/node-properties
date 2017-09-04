const express = require ('express');
const path = require ('path');
const bodyParser = require ('body-parser');
const promisify = require ('es6-promisify');
const expressValidator = require ('express-validator');
const session = require ('express-session');

const home = require ('./routes/home');
const edit = require ('./routes/edit');
const login = require ('./routes/login');

const helpers = require ('./utils/helpers');
// create our Express app
const app = express ();
const server = require ('http').Server (app);
const io = require ('socket.io') (server);
const errorHandlers = require ('./handlers/errorHandlers');
const loginHanderls = require ('./handlers/loginHandler');

// view engine setup
app.set ('views', path.join (__dirname, 'views')); // this is the folder where we keep our pug files
app.set ('view engine', 'pug'); // we use the engine pug, mustache or EJS work great too

// serves up static files from the public folder. Anything in public/ will just be served up as the file it is
app.use (express.static (path.join (__dirname, 'public')));

// Takes the raw requests and turns them into usable properties on req.body
app.use (bodyParser.json ());
app.use (bodyParser.urlencoded ({extended: true}));

// Exposes a bunch of methods for validating data. Used heavily on userController.validateRegister
app.use (expressValidator ());

app.use (
  session ({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
  })
);

// pass variables to our templates + all requests
app.use ((req, res, next) => {
  res.locals.h = helpers;
  res.locals.currentPath = req.path;
  res.io = io;
  req.session.cookie.expires = false;
  next ();
});

app.use (loginHanderls.checkAuth);

// After allllll that above middleware, we finally handle our own routes!
app.use ('/', home);
app.use ('/edit', edit);
app.use ('/login', login);

// If that above routes didnt work, we 404 them and forward to error handler
app.use (errorHandlers.notFound);

// Otherwise this was a really bad error we didn't expect! Shoot eh
if (app.get ('env') === 'development') {
  /* Development Error Handler - Prints stack trace */
  app.use (errorHandlers.developmentErrors);
}

// production error handler
app.use (errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = {
  app: app,
  server: server,
  io: io,
};
