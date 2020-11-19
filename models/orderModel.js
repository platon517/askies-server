const mongoose = require('mongoose');
const Product = require('./productModel');
const Volume = require('./volumeModel');
const Option = require('./optionModel');
const PromoCode = require('./promoCodeModel');

const orderSchema = mongoose.Schema({
  number: {
    type: String,
    required: true
  },
  appUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppUser',
    required: false
  },
  products: {
    type: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      count: {
        type: String,
        required: true
      },
      options: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Option',
        required: false
      }],
      volume: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Volume',
        required: false
      }
    }],
    required: false
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: false
  },
  waitTime: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    required: true
  },
  sum: {
    type: String
  },
  confirmationToken: {
    type: String
  },
  paymentId: {
    type: String
  },
  paid: {
    type: Boolean
  },
  isFreeOrder: {
    type: Boolean,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  promoCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode',
    required: false
  },
  discountValue: {
    type: String,
    required: false
  },
});

orderSchema.pre('save', async function(next) {
  const products = this.products;
  let sum = 0;
  for (const product of products) {
    const productDetail = await Product.findOne({ _id: product.product });

    let productSum = 0;

    productSum += parseFloat(productDetail.price);

    const productVolume = await Volume.findOne({ _id: product.volume });

    if (productVolume) {
      productSum += parseFloat(productVolume.extraPrice);
    }

    const productOptions = await Option.find({ _id: { $in: product.options } });

    productOptions.forEach(option => productSum += parseFloat(option.extraPrice));

    sum += (productSum * parseFloat(product.count))
  }
  if (this.promoCode) {
    const promoCode = await PromoCode.findOne({ _id: this.promoCode._id });
    this.discountValue = promoCode.discountValue;
    sum = sum * ((100 - promoCode.discountValue) / 100)
  }
  sum = Math.ceil(sum);
  this.sum = sum;
  next();
});

const Order = module.exports = mongoose.model('Order', orderSchema);
