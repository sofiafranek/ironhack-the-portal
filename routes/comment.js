'use strict';
const { Router } = require('express');
const router = new Router();

const Post = require('./../models/post');

const routeGuard = require('./../middleware/route-guard');

const uploadCloud = require('./../config/cloudinary');

router.post('/:postId/edit', routeGuard, uploadCloud.single('image'), (req, res, next) => {
  const postId = req.params.postId;

  Post.findOneAndUpdate(
    {
      _id: postId
    },
    {
      content: req.body.text,
      authorId: req.session.user,
      imgName: req.file.originalname,
      imgPath: req.file.url
    }
  )
    .then(data => {
      res.redirect(`/post/${postId}`);
    })
    .catch(error => {
      next(error);
    });
});

module.exports = router;
