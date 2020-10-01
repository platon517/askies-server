const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  img: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  description: {
    type: String,
    required: false
  },
  volumes: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volume',
    }],
    required: false,
    //select: false
  },
  options: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Option',
    }],
    required: false,
    //select: false
  }
});

const Product = module.exports = mongoose.model('Product', productSchema);
