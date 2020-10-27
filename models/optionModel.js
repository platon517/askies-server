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
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  hidden: {
    type: Boolean
  }
});

const Option = module.exports = mongoose.model('Option', optionSchema);
