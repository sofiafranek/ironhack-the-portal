const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../helpers/auth');

// load schema
require('../models/Todo');
const Todo = mongoose.model('Todo');

// Todo Index Page
router.get('/', ensureAuthenticated, (req, res) => {
  Todo.find({ user: req.user.id })
    .sort({ creationDate: 'descending' })
    .then(todos => {
      res.render('todos/index', {
        todos: todos
      });
    });
});

// Note index page after search query
router.post('/search', ensureAuthenticated, (req, res) => {
  let { search } = req.body;

  Todo.find({ user: req.user.id })
    .sort({ creationDate: 'descending' })
    .then(todos => {
      let matched = todos.filter(todos => {
        return (
          todos.title.toLowerCase() === search.toLowerCase() ||
          todos.title
            .toLowerCase()
            .split(' ')
            .includes(search.toLowerCase())
        );
      });
      res.render('todos/index', {
        todos: matched
      });
    });
});

// add todo form
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('todos/add');
});

// edit todo form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Todo.findOne({
    _id: req.params.id
  }).then(todo => {
    if (todo.user != req.user.id) {
      req.flash('error_msg', 'Not authorized');
      res.redirect('/todos');
    } else {
      res.render('todos/edit', {
        todo: todo
      });
    }
  });
});

// view todo
router.get('/:todoId', (req, res, next) => {
  const todoId = req.params.todoId;

  let todo;

  Todo.findById(todoId)
    .then(document => {
      if (!document) {
        next(new Error('NOT_FOUND'));
      } else {
        todo = document;
      }
    })
    .then(posts => {
      res.render('todos/singletodo', { todo });
    })
    .catch(error => {
      next(error);
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
    res.render('todos/add', {
      errors: errors,
      title: req.body.title,
      details: req.body.details,
      dueDate: req.body.duedate
    });
  } else {
    const newUser = {
      title: req.body.title,
      details: req.body.details,
      user: req.user.id,
      dueDate: req.body.duedate
    };
    new Todo(newUser).save().then(todo => {
      req.flash('success_msg', 'Todo added');
      res.redirect('/todos');
    });
  }
});

// edit form process
router.put('/:id', ensureAuthenticated, (req, res) => {
  Todo.findOne({
    _id: req.params.id
  }).then(todo => {
    // new values
    todo.title = req.body.title;
    todo.details = req.body.details;
    todo.dueDate = req.body.duedate;
    todo.save().then(todo => {
      req.flash('success_msg', 'Todo updated');
      res.redirect('/todos');
    });
  });
});

// delete Todo
router.delete('/:id', ensureAuthenticated, (req, res) => {
  Todo.deleteMany({
    _id: req.params.id
  }).then(() => {
    req.flash('success_msg', 'Todo removed');
    res.redirect('/todos');
  });
});

module.exports = router;
