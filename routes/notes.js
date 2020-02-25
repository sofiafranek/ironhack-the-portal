const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../helpers/auth');

// load schema
require('../models/Note');
const Note = mongoose.model('Note');

// Note Index Page
router.get('/', ensureAuthenticated, (req, res) => {
  Note.find({ user: req.user.id })
    .sort({ creationDate: 'descending' })
    .then(notes => {
      res.render('notes/index', {
        notes: notes
      });
    }); // find something in DB
});

// Note index page after search query
router.post('/search', ensureAuthenticated, (req, res) => {
  let { search } = req.body;

  Note.find({ user: req.user.id })
    .sort({ creationDate: 'descending' })
    .then(notes => {
      let matched = notes.filter(notes => {
        return (
          notes.title.toLowerCase() === search.toLowerCase() ||
          notes.title
            .toLowerCase()
            .split(' ')
            .includes(search.toLowerCase())
        );
      });
      console.log(matched);
      res.render('notes/index', {
        notes: matched
      });
    });
});

// add Note form
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('notes/add');
});

// view Note
router.get('/:noteId', (req, res, next) => {
  const noteId = req.params.noteId;

  let note;

  Note.findById(noteId)
    .then(document => {
      if (!document) {
        next(new Error('NOT_FOUND'));
      } else {
        note = document;
      }
    })
    .then(posts => {
      res.render('notes/singlenote', { note });
    })
    .catch(error => {
      next(error);
    });
});

// edit Note form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Note.findOne({
    _id: req.params.id
  }).then(note => {
    if (note.user != req.user.id) {
      req.flash('error_msg', 'Not authorized');
      res.redirect('/notes');
    } else {
      res.render('notes/edit', {
        note: note
      });
    }
  });
});

// process  form
router.post('/', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.title) {
    errors.push({
      text: 'Please add title'
    });
  }
  if (!req.body.details) {
    errors.push({
      text: 'Please add some details'
    });
  }

  if (errors.length > 0) {
    res.render('notes/add', {
      errors: errors,
      title: req.body.title,
      details: req.body.details
    });
  } else {
    const newUser = {
      title: req.body.title,
      details: req.body.details,
      user: req.user.id
    };
    new Note(newUser).save().then(note => {
      req.flash('success_msg', 'Note added');
      res.redirect('/notes');
    });
  }
});

// edit form process
router.put('/:id', ensureAuthenticated, (req, res) => {
  Note.findOne({
    _id: req.params.id
  }).then(note => {
    // new values
    note.title = req.body.title;
    note.details = req.body.details;
    note.dueDate = req.body.duedate;
    note.save().then(note => {
      req.flash('success_msg', 'Note updated');
      res.redirect('/notes');
    });
  });
});

// delete Note
router.delete('/:id', ensureAuthenticated, (req, res) => {
  Note.deleteMany({
    _id: req.params.id
  }).then(() => {
    req.flash('success_msg', 'Note removed');
    res.redirect('/notes');
  });
});

module.exports = router;
