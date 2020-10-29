const Option = require('../models/optionModel');
const adminVerify = require('../helpers/adminVerify');
const verification = require('../helpers/verification');
const { admin, entityAdmin, barista } = require('../constants/accountTypes');

module.exports = app => {

  app.get('/options', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const options = await Option.find({}).populate('shop').exec();
        return res.send(options);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.get('/options/list', async (req, res) => {
    const { skip, limit, search = '', shop = null } = req.query;
    if (await adminVerify(req, res)) {
      try {
        const totalOptions =
          await Option.find({});
        const filter = { name: {$regex : `.*${search}.*`, $options:'i'} };
        if (shop) {
          filter.shop = shop
        }
        const options = await Option.find(filter)
          .populate('shop')
          .skip(parseFloat(skip))
          .limit(parseFloat(limit));

        return res.send(
          {
            data: options,
            count: totalOptions.length
          }
        );
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.get('/barista/options/list', async (req, res) => {
    const { skip, limit, search = ''} = req.query;
    if (await verification(req, res)) {
      try {
        const { tokenUser: { accountType, shop } } = req;
        if (accountType === barista) {
          const totalOptions =
            await Option.find({});
          const filter = { name: {$regex : `.*${search}.*`, $options:'i'}, shop };
          const options = await Option.find(filter)
            .populate('shop')
            .skip(parseFloat(skip))
            .limit(parseFloat(limit));

          return res.send(
            {
              data: options,
              count: totalOptions.length
            }
          );
        }
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/barista/options/:id/hide', async (req, res) => {
    const { id } = req.params;
    const { value } = req.body;
    if (await verification(req, res)) {
      try {
        const { tokenUser: { accountType, shop } } = req;
        if (accountType === barista) {

          await Option.updateOne({ _id: id, shop: shop }, { $set: { hidden: value } });

          return res.send('ok');
        }
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/options', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { name, extraPrice, shop } = req.body;
        if ( !name || !extraPrice || !shop ) {
          return res.status(400).send('Заполните все поля');
        }
        const option = new Option();
        option.name = name;
        option.extraPrice = extraPrice;
        option.shop = shop;
        option.hidden = false;
        await option.save();
        return res.send(option);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.delete('/options/:id', async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      try {
        await Option.deleteOne({ _id: id });
        return res.send('OK');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

};
