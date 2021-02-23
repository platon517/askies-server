const mongoose = require('mongoose');

const askieSchema = mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enableComments: {
    type: Boolean,
    required: true
  },
  options: {
    type: [{
      value: {
        type: String,
        required: true
      },
      percents: {
        type: Number,
        default: 0
      },
      voters: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
      }
    }]
  },
  comments: {
    type: [
      {
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        text: {
          type: String,
          required: true
        },
        date: {
          type: Date
        },
        replyTo: {
          type: String,
        }
      }
    ]
  }
});

module.exports = mongoose.model('Askie', askieSchema);
