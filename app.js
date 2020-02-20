const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const hbs = require('hbs');
const app = express();
const passport = require('passport');

// load routes
const todos = require('./routes/todos');
const users = require('./routes/users');
const notes = require('./routes/notes');
const channels = require('./routes/channel');

// passport config
require('./config/passport')(passport);

// db config
const db = require('./config/database');

// connect to mongoose
mongoose
  .connect(db.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected...');
  })
  .catch(err => {
    console.log(err);
  });

// Express View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// body parser middleware
// - parse application/x-www-form-urlencoded
// - parse application/json
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// method override
app.use(methodOverride('_method'));

// express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// add passport middleware
// it is very important to add this after the express session
app.use(passport.initialize());
app.use(passport.session());

// flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg'); // needed for flash to work
  res.locals.error_msg = req.flash('error_msg'); // needed for flash to work
  res.locals.error = req.flash('error'); // needed for flash to work
  res.locals.user = req.user || null; // needed for passport login/logout to work
  next();
});

app.get('/', (req, res) => {
  res.render('home');
});

// use routes
app.use('/users', users);
app.use('/todos', todos);
app.use('/notes', notes);
app.use('/channel', channels);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

module.exports = app;
