const Category = require('../models/categoryModel');
const adminVerify = require('../helpers/adminVerify');

module.exports = app => {

  app.get('/categories', async (req, res) => {
    try {
      const categories = await Category.find({}).sort({ order: 1 }).exec();
      return res.send(categories);
    } catch (e) {
      res.status(400).send({'error': 'An error has occurred'});
    }
  });

  app.post('/categories', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { name } = req.body;
        if ( !name ) {
          return res.status(400).send('Заполните все поля');
        }
        const category = new Category();
        category.name = name;
        await category.save();
        return res.send(category);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.put('/categories/:id/set-order', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { id } = req.params;
        const { order } = req.body;
        if ( !id ) {
          return res.status(400).send('id не найдено');
        }

        await Category.update({ _id: id }, { $set: { order } });
        const category = await Category.findOne({ _id: id });
        return res.send(category);
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.delete('/categories/:id', async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      try {
        await Category.deleteOne({ _id: id });
        return res.send('OK');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

};
