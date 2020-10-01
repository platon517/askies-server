const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const adminVerify = require('../helpers/adminVerify');

module.exports = app => {

  app.get('/shops', async (req, res) => {
    try {
      const shops = await Shop.find({}).populate('entity').exec();
      return res.send(shops);
    } catch (e) {
      res.status(400).send({'error': 'An error has occurred'});
    }
  });

  app.get('/shops/:id/products', async (req, res) => {
    try {
      const { id } = req.params;
      const products =
        await Product
          .find({ shop: id })
          .select('+volumes')
          .populate('volumes')
          .select('+options')
          .populate('options')
          .populate('category')
          .sort({
            _id: -1
          })
          .exec();
      return res.send(products);
    } catch (e) {
      res.status(400).send({'error': 'An error has occurred'});
    }
  });

  app.post('/shops', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { address, coordinate, entity } = req.body;
        if ( !coordinate.latitude || !coordinate.longitude || !address || !entity ) {
          return res.status(400).send('Заполните все поля');
        }
        const shop = new Shop();
        shop.address = address;
        shop.coordinate = coordinate;
        shop.entity = entity;
        await shop.save();
        return res.send(shop);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.delete('/shops/:id', async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      try {
        await Shop.deleteOne({ _id: id });
        return res.send('OK');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

};
