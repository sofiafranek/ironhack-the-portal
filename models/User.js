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
      default: 'N/A'
    },
    cohort: {
      type: String,
      default: 'N/A'
    },
    studytime: {
      type: ['Part-Time', 'Full-Time', 'N/A'],
      default: 'N/A'
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
