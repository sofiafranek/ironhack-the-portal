const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const NoteSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  creationDate: {
    type: Date,
    default: Date.now
  }
});

mongoose.model('Note', NoteSchema);
