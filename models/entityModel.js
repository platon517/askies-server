const mongoose = require('mongoose');

const entitySchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promoCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
    required: false
  },
  kassaShopId: {
    type: String,
    required: false
  },
  kassaApiToken: {
    type: String,
    required: false
  },
  freeOrderPaymentKassaId: {
    type: String,
    required: false
  },
  freeOrderPaymentId: {
    type: String,
    required: false
  },
});

module.exports = mongoose.model('Entity', entitySchema);
