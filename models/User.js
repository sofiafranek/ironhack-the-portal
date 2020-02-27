const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// create schema
const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    usertype: {
      type: ['Student', 'Teacher Assistant', 'Teacher'],
      default: 'Undefined',
      required: true
    },
    number: {
      type: String,
      default: 'None listed'
    },
    campus: {
      type: String,
      default: 'None listed'
    },
    cohort: {
      type: String,
      default: 'None listed'
    },
    password: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

mongoose.model('User', UserSchema);
