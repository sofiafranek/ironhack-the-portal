const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const { ensureAuthenticated } = require('../helpers/auth');

// load user model
require('../models/User');
const User = mongoose.model('User');
require('../models/Todo');
const Todo = mongoose.model('Todo');
require('../models/Note');
const Note = mongoose.model('Note');

// user login route
router.get('/login', (req, res) => {
  res.render('users/login');
});

// user dashboard route
router.get('/dashboard', ensureAuthenticated, (req, res, next) => {
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
      res.render('users/dashboard', { posts, allNotes: notes, allTodos: todos });
    })
    .catch(error => {
      next(error);
    });
});

// user to go to edit profile page
router.get('/dashboard/profile', ensureAuthenticated, (req, res) => {
  res.render('users/profile');
});

// edit profile post results
router.post('/dashboard/profile', ensureAuthenticated, (req, res) => {
  const userId = req.user._id;
  const { name, email } = req.body;

  User.findByIdAndUpdate(userId, {
    name,
    email
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
