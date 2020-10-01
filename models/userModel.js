const mongoose = require('mongoose');
const { admin, entityAdmin, barista } = require('../constants/accountTypes');

const userSchema = mongoose.Schema({
  login: {
    unique: true,
    dropDups: true,
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  entity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entity',
    required: false
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  accountType: {
    type: String,
    enum : [admin, entityAdmin, barista],
    default: barista
  }
});

module.exports = mongoose.model('User', userSchema);
