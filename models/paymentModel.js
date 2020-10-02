const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema({
  sum: {
    type: String,
    required: true
  },
  entity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entity',
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
