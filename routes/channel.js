'use strict';

const { Router } = require('express');
const router = new Router();

const Channel = require('./../models/channel');
const Post = require('./../models/post');
const Comment = require('./../models/comment');

const { ensureAuthenticated } = require('../helpers/auth');

const hbs = require('hbs');

hbs.registerHelper('ifvalue', function(conditional, options) {
  if (conditional == options.hash.equals) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// rendering the main feed page
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

// the list of all channels page
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

// when user wants to create a channel this directs to the view to create a channel
router.get('/create', ensureAuthenticated, (req, res, next) => {
  res.render('channel/create');
});

// when a user creates a channel
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

// when user wants to view the channel and all the posts created in that channel appear too
router.get('/:channelId', ensureAuthenticated, (req, res, next) => {
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

// when user wants to create a post render to the create post view
router.get('/:channelId/post/create', ensureAuthenticated, (req, res, next) => {
  res.render('channel/create-post');
});

// create a single post
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

// to view the single post view
router.get('/:channelId/post/:postId', ensureAuthenticated, (req, res, next) => {
  const { postId } = req.params;
  const user = req.user._id;
  let sameUser;
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
      user.toString() == post.author._id.toString() ? (sameUser = true) : (sameUser = false);
      //console.log(sameUser);
      // console.log('this is the post', post);
      // console.log('this is the comment', comments);
      res.render('channel/single-post', { post, comments, sameUser });
    })
    .catch(error => {
      next(error);
    });
});

// router to edit a single post
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

// route to edit a single post
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

// route to add a comment to a single post
router.post('/:channelId/post/:postId/comment', ensureAuthenticated, (req, res, next) => {
  const { channelId, postId } = req.params;
  const { content } = req.body;

  Post.findById(postId)
    .then(post => {
      if (!post) {
        return Promise.reject(new Error('NOT_FOUND'));
      } else {
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

// route to add a comment to a single post
router.post('/:postId/:commentId/delete', ensureAuthenticated, (req, res, next) => {
  const { commentId, postId } = req.params;
  let channelId;
  //first im gonna look for the channel in the post model
  Post.findById(postId)
    .then(post => {
      channelId = post.channel;
    })
    .then(() => {
      //then i will be removing the comment and redirecting the user
      Comment.findByIdAndDelete(commentId).then(() => {
        res.redirect(`/channel/${channelId}/post/${postId}`);
      });
    })
    .catch(error => {
      next(error);
    });
});

module.exports = router;
