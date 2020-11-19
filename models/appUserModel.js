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
      },
      entity: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entity',
        required: true
      }
    }],
    select: false
  },
  freeOrderUsed: {
    type: Boolean,
  }
});

module.exports = mongoose.model('AppUser', appUserSchema);
