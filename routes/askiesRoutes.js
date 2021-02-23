const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jwtConfig = require('../config/jwtConfig');
const verification = require('../helpers/verification') ;
const Askie = require('../models/askieModel');

const saltRounds = 10;

module.exports = app => {

  app.get('/askies', async (req, res) => {
    try {
      const askies = await Askie.find({}).populate('author');
      res.send(askies);
    } catch (e) {
      res.send({'error':'An error has occurred'});
    }
  });

  app.post("/askies", async (req, res) => {
    const { question, author, enableComments, options } = req.body;
    try {
      const askie = new Askie();
      if ( !question || !author || enableComments === undefined || !options ) {
        return res.status(400).send('All fields required');
      }
      askie.question = question;
      askie.author = author;
      askie.enableComments = enableComments;
      askie.options = options;

      askie.save();

      res.send(askie);
    } catch (e) {
      res.status(400).send({
        error: e
      });
    }
  });

  app.get('/askies/:id', async (req, res) => {

    const { id } = req.params;

    try {
      const askie =
        await Askie.findOne({ _id: id })
          .populate('author')
          .populate('comments.author');
      res.send(askie);
    } catch (e) {
      res.send({'error':'An error has occurred'});
    }
  });

  app.post('/askies/:id/vote/:optionId', async (req, res) => {
    if (await verification(req, res)) {
      const { id, optionId } = req.params;

      const prevAskie = await Askie.findOne({ _id: id });

      const isVoted = prevAskie.options.some(option => option.voters.find(voter => voter === req.tokenUser._id));

      if (isVoted) {
        return res.status(400).send('Already voted');
      }

      try {

        await Askie.findOneAndUpdate(
          { _id: id, 'options._id': optionId },
          {
            $addToSet: {
              'options.$.voters': req.tokenUser._id
            },
          }
        );

        const askie = await Askie.findOne({ _id: id });

        res.send(askie);
      } catch (e) {
        res.send({'error':'An error has occurred'});
      }
    }
  });

  app.post('/askies/:id/comment', async (req, res) => {
    if (await verification(req, res)) {
      const { id } = req.params;
      const { text, replyTo } = req.body;

      if ( !text || text.replace(/ /g,'').length <= 0) {
        return res.status(400).send('All fields required');
      }

      const newComment = {
        author: req.tokenUser._id,
        text,
        replyTo,
        date: new Date()
      };

      try {

        await Askie.findOneAndUpdate(
          { _id: id },
          {
            $push: {
              comments: newComment
            },
          }
        );

        const askie = await Askie.findOne({ _id: id });

        res.send(askie);
      } catch (e) {
        res.send({'error':'An error has occurred'});
      }
    }
  });

};
