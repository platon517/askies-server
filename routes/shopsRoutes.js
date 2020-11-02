const Entity = require('../models/entityModel');
const Shop = require('../models/shopModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const adminVerify = require('../helpers/adminVerify');
const verification = require('../helpers/verification');
const { upload, deleteImage } = require('../helpers/upload');
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
            order: 1
          })
          .exec();
      return res.send(products);
    } catch (e) {
      res.status(400).send({'error': 'An error has occurred'});
    }
  });

  app.post('/shops', upload.single("image"), async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { address, coordinate, entity, isHidden, commission, color } = req.body;
        if (
          !coordinate.latitude ||
          !coordinate.longitude ||
          !address ||
          !entity ||
          (isHidden === undefined) ||
          (commission === undefined)
        ) {
          return res.status(400).send('Заполните все поля');
        }
        const shop = new Shop();
        shop.address = address;
        shop.coordinate = JSON.parse(coordinate);
        shop.entity = entity;
        shop.isHidden = isHidden;
        shop.isActive = false;
        shop.commission = commission;
        if (color) {
          shop.color = color;
        }
        if (req.file) {
          shop.img = req.file.location;
        }
        await shop.save();
        return res.send(shop);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.put('/shops/:id', upload.single("image"), async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { id } = req.params;
        const { isHidden, address, coordinate, entity, commission, color } = req.body;
        if ( !id ) {
          return res.status(400).send('id не найдено');
        }

        const shop = await Shop.findOne({ _id: id });
        const targetEntity = await Entity.findOne({ _id: shop.entity });

        if (!targetEntity.kassaShopId || !targetEntity.kassaApiToken) {
          return res.status(400).send('Касса не подключена');
        }

        const updateData = {};

        if (isHidden !== undefined) {
          updateData.isHidden = isHidden;
        }
        if (req.file) {
          updateData.img = req.file.location;
        }
        if (address !== undefined) {
          updateData.address = address;
        }
        if (coordinate !== undefined) {
          updateData.coordinate = JSON.parse(coordinate);
        }
        if (entity !== undefined) {
          updateData.entity = entity;
        }
        if (commission !== undefined) {
          updateData.commission = commission;
        }
        if (color !== undefined) {
          updateData.color = color;
        }

        await Shop.update({ _id: id }, { $set: updateData });
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

  app.get('/barista/employees', async (req, res) => {
    if (await verification(req, res)) {
      try {
        const { tokenUser: { accountType, shop } } = req;
        if (accountType !== barista) {
          return res.status(400).send('Ошибка. Доступно только баристе.');
        }
        const targetShop = await Shop.findOne({ _id: shop }).select('+employeesPhoneNumbers');
        return res.send(targetShop.employeesPhoneNumbers);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/barista/employees', async (req, res) => {
    if (await verification(req, res)) {
      try {
        const { tokenUser: { accountType, shop } } = req;
        if (accountType !== barista) {
          return res.status(400).send('Ошибка. Доступно только баристе.');
        }
        const { number } = req.body;
        await Shop.updateOne({ _id: shop }, { $push: { employeesPhoneNumbers: { number, isActive: false } } });
        return res.send('ok');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.put('/barista/employees/:id', async (req, res) => {
    if (await verification(req, res)) {
      try {
        const { tokenUser: { accountType, shop } } = req;
        if (accountType !== barista) {
          return res.status(400).send('Ошибка. Доступно только баристе.');
        }
        const { id } = req.params;
        const { isActive } = req.body;
        await Shop.updateOne(
          { _id: shop, 'employeesPhoneNumbers._id': id },
          { $set: { 'employeesPhoneNumbers.$.isActive': isActive } }
        );
        return res.send('ok');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

};
