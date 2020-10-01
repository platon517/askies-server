const Category = require('../models/categoryModel');
const adminVerify = require('../helpers/adminVerify');

module.exports = app => {

  app.get('/categories', async (req, res) => {
    try {
      const categories = await Category.find({}).exec();
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
