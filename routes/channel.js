'use strict';

const { Router } = require('express');
const router = new Router();

const Channel = require('./../models/channel');
const Post = require('./../models/post');
const Comment = require('./../models/comment');

const { ensureAuthenticated } = require('../helpers/auth');

router.get('/', ensureAuthenticated, (req, res, next) => {
  let channels;

  Channel.find()
    .limit(10)
    .then(documents => {
      channels = documents;
      return Post.find()
        .populate('channel author')
        .limit(20);
    })
    .then(posts => {
      res.render('channel/home', { posts, popularChannels: channels });
    })
    .catch(error => {
      next(error);
    });
});

router.get('/allchannels', ensureAuthenticated, (req, res, next) => {
  let channels;
  Channel.find()
    .then(documents => {
      channels = documents;
      return Post.find().populate('channel author');
    })
    .then(posts => {
      res.render('channel/list', { posts, allChannels: channels });
    })
    .catch(error => {
      next(error);
    });
});

router.get('/create', ensureAuthenticated, (req, res, next) => {
  res.render('channel/create');
});

router.post('/create', ensureAuthenticated, (req, res, next) => {
  const { name } = req.body;
  Channel.create({
    name
  })
    .then(channel => {
      res.redirect(`/channel/${channel._id}`);
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:channelId', ensureAuthenticated, (req, res, next) => {
  // const { channelId } = req.params;
  const channelId = req.params.channelId;

  let channel;

  Channel.findById(channelId)
    .then(document => {
      if (!document) {
        next(new Error('NOT_FOUND'));
      } else {
        channel = document;
        return Post.find({ channel: channelId })
          .populate('channel author')
          .limit(50);
      }
    })
    .then(posts => {
      res.render('channel/single', { channel, posts });
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:channelId/post/create', ensureAuthenticated, (req, res, next) => {
  res.render('channel/create-post');
});

router.post('/:channelId/post/create', ensureAuthenticated, (req, res, next) => {
  const { title, content } = req.body;
  const { channelId } = req.params;

  const author = req.user._id;

  Post.create({
    title,
    content,
    channel: channelId,
    author
  })
    .then(post => {
      res.redirect(`/channel/${post.channel}/post/${post._id}`);
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:channelId/post/:postId', ensureAuthenticated, (req, res, next) => {
  const { postId } = req.params;

  Post.findById(postId)
    .populate('channel author')
    .then(post => {
      if (!post) {
        next(new Error('NOT_FOUND'));
      } else {
        console.log(post);
        res.render('channel/single-post', { post });
      }
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:channelId/post/:postId', ensureAuthenticated, (req, res, next) => {
  const { postId } = req.params;

  let post;
  Post.findById(postId)
    .populate('channel author')
    .then(document => {
      post = document;
      if (!document) {
        return Promise.reject(new Error('NOT_FOUND'));
      } else {
        return Comment.find({ post: postId }).populate('author');
      }
    })
    .then(comments => {
      res.render('channel/single-post', { post, comments });
    })
    .catch(error => {
      next(error);
    });
});

router.get('/:channelId/post/:postId/edit', ensureAuthenticated, (req, res, next) => {
  const { postId } = req.params;

  Post.findOne({
    _id: postId,
    author: req.user._id
  })
    .then(post => {
      if (post) {
        res.render('channel/edit-post', { post });
      } else {
        next(new Error('NOT_FOUND'));
      }
    })
    .catch(error => {
      next(error);
    });
});

// route to delete a post
router.post('/:channelId/post/:postId/delete', ensureAuthenticated, (req, res, next) => {
  const { postId } = req.params;
  Post.findOneAndDelete(postId)
    .then(post => {
      res.redirect(`/channel`);
    })
    .catch(error => {
      next(error);
    });
});

// route to delete a channel which deletes all of the posts in that channel too
router.post('/:channelId/delete', ensureAuthenticated, (req, res, next) => {
  const { channelId } = req.params;

  Channel.deleteOne().then(post => {
    Post.findOneAndDelete(channelId)
      .then(post => {
        res.redirect(`/channel`);
      })
      .catch(error => {
        next(error);
      });
  });
});

router.post('/:channelId/post/:postId/edit', ensureAuthenticated, (req, res, next) => {
  const { channelId, postId } = req.params;
  const { title, content } = req.body;

  Post.findOneAndUpdate(
    {
      _id: postId,
      author: req.user._id
    },
    {
      title,
      content
    }
  )
    .then(() => {
      res.redirect(`/channel/${channelId}/post/${postId}`);
    })
    .catch(error => {
      next(error);
    });
});

router.post('/:channelId/post/:postId/comment', ensureAuthenticated, (req, res, next) => {
  const { channelId, postId } = req.params;
  const { content } = req.body;

  Post.findById(postId)
    .populate('channel author')
    .then(post => {
      if (!post) {
        next(new Error('NOT_FOUND'));
        return Promise.reject(new Error('NOT_FOUND'));
      } else {
        console.log(post);
        res.render('channel/single-post', { post });
        return Comment.create({
          post: postId,
          author: req.user._id,
          content
        });
      }
    })
    .then(() => {
      res.redirect(`/channel/${channelId}/post/${postId}`);
    })
    .catch(error => {
      next(error);
    });
});

module.exports = router;
