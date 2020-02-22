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
    // usertype: {
    //   type: String,
    //   required: true
    // },
    password: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    imgName: String,
    imgPath: String
  },
  {
    timestamps: true
  }
);

mongoose.model('User', UserSchema);
