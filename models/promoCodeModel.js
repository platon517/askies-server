const mongoose = require('mongoose');

const promoCodeSchema = mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  }
});

const PromoCode = module.exports = mongoose.model('PromoCode', promoCodeSchema);
