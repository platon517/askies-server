const Entity = require('../models/entityModel');
const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const adminVerify = require('../helpers/adminVerify');
const verification = require('../helpers/verification');
const { admin, entityAdmin, barista } = require('../constants/accountTypes');

module.exports = app => {

  app.get('/shops/all', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const shops = await Shop.find({}).populate('entity').exec();
        return res.send(shops);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.get('/shops', async (req, res) => {
    try {
      const shops = await Shop.find({ isHidden: false }).populate('entity').exec();
      return res.send(shops);
    } catch (e) {
      res.status(400).send({'error': 'An error has occurred'});
    }
  });

  app.get('/shops/:id', async (req, res) => {
    const { id } = req.params;
    if (await verification(req, res)) {
      try {
        const shops = await Shop.findOne({ _id: id });
        return res.send(shops);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.get('/shops/:id/products', async (req, res) => {
    try {
      const { id } = req.params;
      const products =
        await Product
          .find({ shop: id, hidden: false })
          .select('+volumes')
          .populate('volumes')
          .select('+options')
          .populate('options', null, { hidden: false })
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
        const { address, coordinate, entity, isHidden } = req.body;
        if ( !coordinate.latitude || !coordinate.longitude || !address || !entity || (isHidden === undefined) ) {
          return res.status(400).send('Заполните все поля');
        }
        const shop = new Shop();
        shop.address = address;
        shop.coordinate = coordinate;
        shop.entity = entity;
        shop.isHidden = isHidden;
        shop.isActive = false;
        await shop.save();
        return res.send(shop);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.put('/shops/:id', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { id } = req.params;
        const { isHidden } = req.body;
        if ( !id ) {
          return res.status(400).send('id не найдено');
        }

        const shop = await Shop.findOne({ _id: id });
        const entity = await Entity.findOne({ _id: shop.entity });

        if (!entity.kassaShopId || !entity.kassaApiToken) {
          return res.status(400).send('Касса не подключена');
        }

        await Shop.update({ _id: id }, { $set: { isHidden } });
        return res.send(shop);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.put('/shops/:id/set-active', async (req, res) => {
    if (await verification(req, res)) {
      try {
        const { id } = req.params;
        const { value } = req.body;
        if ( !id ) {
          return res.status(400).send('id не найдено');
        }

        const { tokenUser: { accountType } } = req;
        if (accountType === barista) {
          await Shop.updateOne({ _id: id }, { $set: { isActive: value } });
          const shop = await Shop.findOne({ _id: id });
          return res.send(shop);
        }
        return res.status(400).send({'error': 'An error has occurred'});
      } catch (e) {
        return res.status(400).send({'error': 'An error has occurred'});
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
