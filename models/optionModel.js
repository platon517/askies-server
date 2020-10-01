const mongoose = require('mongoose');

const optionSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  extraPrice: {
    type: String,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
});

const Option = module.exports = mongoose.model('Option', optionSchema);
