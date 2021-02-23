const mongoose = require('mongoose');

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
  }
});

module.exports = mongoose.model('User', userSchema);
