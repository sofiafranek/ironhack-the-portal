'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

const Model = mongoose.model('Channel', schema);

module.exports = Model;
