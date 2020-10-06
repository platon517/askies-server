const PromoCode = require('../models/promoCodeModel');
const Entity = require('../models/entityModel');
const Shop = require('../models/shopModel');
const adminVerify = require('../helpers/adminVerify');

module.exports = app => {

  app.get('/promo-codes', async (req, res) => {
    try {
      const promoCodes = await PromoCode.find({}).exec();
      return res.send(promoCodes);
    } catch (e) {
      res.status(400).send({'error': 'An error has occurred'});
    }
  });

  app.get('/promo-code/', async (req, res) => {
    try {
      const { code, entityId } = req.query;
      const promoCode = await PromoCode.findOne({ code: code.toUpperCase() }).exec();
      const entity = await Entity.findOne({ _id: entityId });
      if (promoCode && entity.promoCode && entity.promoCode.equals(promoCode._id)) {
        return res.send(promoCode);
      }
      return res.status(400).send({
        error: 'Промокод не действителен'
      });
    } catch (e) {
      res.status(400).send({'error': 'An error has occurred'});
    }
  });

  app.post('/promo-codes', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { code, discountValue } = req.body;
        if ( !code || !discountValue ) {
          return res.status(400).send('Заполните все поля');
        }
        const existPromoCode = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existPromoCode) {
          return res.status(400).send('Код занят');
        }
        const promoCode = new PromoCode();
        promoCode.code = code.toUpperCase();
        promoCode.discountValue = Math.min(Math.max(discountValue, 0), 100);
        await promoCode.save();
        return res.send(promoCode);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.delete('/promo-codes/:id', async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      try {
        await Entity.updateMany({ promoCode: id }, { $set: { promoCode: null } });
        await PromoCode.deleteOne({ _id: id });
        return res.send('OK');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

};
