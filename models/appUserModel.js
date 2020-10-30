const mongoose = require('mongoose');

const appUserSchema = mongoose.Schema({
  phone: {
    unique: true,
    dropDups: true,
    type: String,
    required: true
  },
  smsCode: {
    type: String,
  },
  smsCodeCreatedAt: {
    type: Date
  },
  pushToken: {
    type: String,
  },
  paymentMethods: {
    type: [{
      paymentId: {
        type: String,
        required: true
      },
      card: {
        type: Object,
        required: true
      }
    }]
  }
});

module.exports = mongoose.model('AppUser', appUserSchema);
