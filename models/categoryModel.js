const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: false
  }
});

const Category = module.exports = mongoose.model('Category', categorySchema);
