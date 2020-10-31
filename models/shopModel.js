const mongoose = require('mongoose');

const shopSchema = mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  coordinate: {
    latitude: {
      type: String,
      required: true
    },
    longitude: {
      type: String,
      required: true
    }
  },
  entity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entity',
    required: true
  },
  isHidden: {
    type: Boolean,
    required: true
  },
  isActive: {
    type: Boolean,
  },
  commission: {
    type: String,
    required: true
  },
  img: {
    type: String,
    required: false
  }
});

const Shop = module.exports = mongoose.model('Shop', shopSchema);
