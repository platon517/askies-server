const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jwtConfig = require('../config/jwtConfig');
const User = require('../models/userModel');
const { admin, entityAdmin, barista } = require('../constants/accountTypes');

const saltRounds = 10;

module.exports = app => {

  app.get('/users', async (req, res) => {
    try {
      const users = await User.find({}).populate('shop').populate('entity').exec();
      res.send(users);
    } catch (e) {
      res.send({'error':'An error has occurred'});
    }
  });

  app.post("/users", async (req, res) => {
    const { login, password, accountType, shop, entity } = req.body;
    try {
      const user = new User();
      if ( !login || !password || !accountType ) {
        return res.status(400).send('Заполните все поля');
      }
      user.login = login;
      user.password = await bcrypt.hash(password, saltRounds);
      user.accountType = accountType;
      if (accountType === barista) {
        if ( !entity || !shop ) {
          return res.status(400).send('Заполните все поля');
        }
        user.entity = entity;
        user.shop = shop;
      }

      const savedUser = await user.save();

      const token = jwt.sign({ _id: savedUser._id }, jwtConfig.secret, {
        expiresIn: 86400
      });
      res.send({
        ...savedUser.toObject(),
        token
      });
    } catch (e) {
      res.status(400).send({
        error: e
      });
    }
  });

  app.post("/login", async (req, res) => {
    const { login, password } = req.body;
    if ( !req.body || !login || !password) {
      return res.status(400).send('Введите логин и пароль');
    }

    try {
      const user = await User.findOne({ 'login': login }).select('+password');

      const result = await bcrypt.compare(password, user.password);

      if (result) {
        const token = jwt.sign({ _id: user._id }, jwtConfig.secret, {
          expiresIn: user.accountType === barista ? 86400 * 365 : 86400// expires in 24 hours
        });
        res.send({
          _id: user._id,
          login: user.login,
          accountType: user.accountType,
          entity: user.entity,
          shop: user.entity,
          token
        });
      } else {
        res.status(400).send({
          error: 'Wrong password'
        })
      }
    } catch (e) {
      res.status(400).send({
        error: 'No such user'
      })
    }

  });

  app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await User.deleteOne({ _id: id });
      res.send('OK')
    } catch (e) {
      res.status(400).send({
        error: 'Error'
      })
    }
  });

};
