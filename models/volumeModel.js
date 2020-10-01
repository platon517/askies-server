const mongoose = require('mongoose');

const volumeSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  measure: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  extraPrice: {
    type: String,
    required: true
  },
});

const Volume = module.exports = mongoose.model('Volume', volumeSchema);
