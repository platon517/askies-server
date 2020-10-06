const Entity = require('../models/entityModel');
const User = require('../models/userModel');
const adminVerify = require('../helpers/adminVerify');
const { admin, entityAdmin, barista } = require('../constants/accountTypes');

module.exports = app => {

  app.get('/entities', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const entities = await Entity.find({}).populate('owner').populate('promoCodes').exec();
        return res.send(entities);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/entities', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { name, owner } = req.body;
        if (!name || !owner) {
          return res.status(400).send({'error': 'Complete all fields'});
        }
        const ownerObj = await User.findOne({ _id: owner });
        if (ownerObj.accountType !== admin && ownerObj.accountType !== entityAdmin) {
          return res.status(400).send({'error': 'Owner need to be admin'});
        }
        const entity = new Entity();
        entity.name = name;
        entity.owner = owner;
        await entity.save();
        return res.send(entity);
      } catch (e) {
        return res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.delete('/entities/:id', async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      try {
        await Entity.deleteOne({ _id: id });
        return res.send('OK');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/entities/:id/promo-code', async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      const { promoCodeId } = req.body;
      try {
        await Entity.update({ _id: id }, { $set: { promoCode: promoCodeId } });
        return res.send('OK');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

};
