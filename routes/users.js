const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const hbs = require('hbs');

const { ensureAuthenticated } = require('../helpers/auth');

// load user model
require('../models/User');
const User = mongoose.model('User');
require('../models/Todo');
const Todo = mongoose.model('Todo');
require('../models/Note');
const Note = mongoose.model('Note');

hbs.registerHelper('select', function(value, options) {
  return options
    .fn(this)
    .split('\n')
    .map(function(v) {
      let t = 'value="' + value + '"';
      return !RegExp(t).test(v) ? v : v.replace(t, t + ' selected="selected"');
    })
    .join('\n');
});

// user login route
router.get('/login', (req, res) => {
  res.render('users/login');
});

// user dashboard route
router.get('/dashboard', ensureAuthenticated, (req, res, next) => {
  let private;

  if (req.user.usertype) {
    private = req.user.usertype.toString() === 'Teacher' ? true : false;
  }

  let notes;
  Note.find({ user: req.user.id })
    .sort({ creationDate: 'descending' })
    .limit(10)
    .then(documents => {
      notes = documents;
      return Note.find().populate('notes author');
    });
  let todos;
  Todo.find({ user: req.user.id })
    .sort({ creationDate: 'descending' })
    .limit(10)
    .then(documents => {
      todos = documents;
      return Note.find()
        .populate('todos author')
        .limit(10);
    })
    .then(posts => {
      res.render('users/dashboard', {
        posts,
        allNotes: notes,
        allTodos: todos,
        privatePage: private
      });
    })
    .catch(error => {
      next(error);
    });
});

// user to go to edit profile page
router.get('/private', ensureAuthenticated, (req, res) => {
  let private;

  if (req.user.usertype) {
    private = req.user.usertype.toString() === 'Teacher' ? true : false;
  }

  let user;
  User.find()
    .then(documents => {
      user = documents;
      return user;
    })
    .then(user => {
      res.render('users/private', { allUsers: user, privatePage: private });
    })
    .catch(error => {
      next(error);
    });
});

// the list of all users page
router.post('/private/search', ensureAuthenticated, (req, res, next) => {
  let private;

  if (req.user.usertype) {
    private = req.user.usertype.toString() === 'Teacher' ? true : false;
  }

  let { usersearch } = req.body;
  let users;

  User.find()
    .then(documents => {
      users = documents;
      let matched = users.filter(users => {
        return (
          users.name.toLowerCase() === usersearch.toLowerCase() ||
          users.name
            .toLowerCase()
            .split(' ')
            .includes(usersearch.toLowerCase())
        );
      });
      res.render('users/private', { allUsers: matched, privatePage: private });
    })
    .catch(error => {
      next(error);
    });
});

// Private Page but filtered
router.post('/private/filtered', ensureAuthenticated, (req, res) => {
  let private;

  if (req.user.usertype) {
    private = req.user.usertype.toString() === 'Teacher' ? true : false;
  }

  let { filtered } = req.body;
  console.log(filtered);

  User.find()
    .sort({ creationDate: 'descending' })
    .then(users => {
      let filter = users.filter(users => {
        if (filtered[0] === 'All') {
          return users.usertype.toString();
        }
        if (filtered[1] === 'All') {
          return users.studytime;
        }
        if (filtered[2] === 'All') {
          return users.campus;
        }
        if (filtered[3] === 'All') {
          return users.cohort;
        }

        return users.usertype.toString() === filtered;
      });

      res.render('users/private', {
        allUsers: filter,
        privatePage: private
      });
    });
});

// user to go to edit profile page
router.get('/dashboard/profile', ensureAuthenticated, (req, res) => {
  let data = {
    states: ['Student', 'Teacher Assistant', 'Teacher', 'Part-Time', 'Full-Time', 'N/A'],
    userType: req.user.usertype.toString(),
    studyTime: req.user.studytime.toString()
  };
  // let array = ['Student', 'Teacher Assistant', 'Teacher'];
  res.render('users/profile', data);
});

// edit profile post results
router.post('/dashboard/profile', ensureAuthenticated, (req, res, next) => {
  const userId = req.user._id;
  const { name, email, usertype, number, campus, cohort, studytime } = req.body;

  User.findByIdAndUpdate(userId, {
    name,
    email,
    usertype,
    number,
    campus,
    cohort,
    studytime
  })
    .then(() => {
      req.flash('success_msg', 'New profile settings updated');
      res.redirect('/users/dashboard');
    })
    .catch(error => {
      next(error);
    });
});

// user login route
router.get('/register', (req, res) => {
  res.render('users/register');
});

// login form post
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/users/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// register form post
router.post('/register', (req, res) => {
  let errors = [];
  if (req.body.password != req.body.password2) {
    errors.push({ text: 'Passwords do not match!' });
  }
  if (req.body.password.length < 4) {
    errors.push({ text: 'Password must be at least 4 characters' });
  }
  if (errors.length > 0) {
    res.render('users/login', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      password2: req.body.password2
    });
  } else {
    User.findOne({
      email: req.body.email
    }).then(user => {
      if (user) {
        req.flash('error_msg', 'A user with the same email already exists');
        res.redirect('/users/register');
      } else {
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash('success_msg', 'You are now registered and can login');
                res.redirect('/users/login');
              })
              .catch(err => {
                console.log(err);
                return;
              });
          });
        });
      }
    });
  }
});

router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
