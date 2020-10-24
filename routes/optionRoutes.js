const Option = require('../models/optionModel');
const adminVerify = require('../helpers/adminVerify');

module.exports = app => {

  app.get('/options', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const options = await Option.find({}).exec();
        return res.send(options);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/options', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { name, extraPrice } = req.body;
        if ( !name || !extraPrice ) {
          return res.status(400).send('Заполните все поля');
        }
        const option = new Option();
        option.name = name;
        option.extraPrice = extraPrice;
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
