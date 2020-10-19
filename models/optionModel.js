const mongoose = require('mongoose');

const optionSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  extraPrice: {
    type: String,
    required: true
  }
});

const Option = module.exports = mongoose.model('Option', optionSchema);
