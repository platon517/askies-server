const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jwtConfig = require('../config/jwtConfig');
const User = require('../models/userModel');

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
    const { login, password } = req.body;
    try {
      const sameLoginUser = await User.findOne({ login });

      const errors = {};
      if ( !login ) {
        errors.login = 'Enter login';
      }
      if ( !password ) {
        errors.password = 'Enter password';
      }
      if ( login && sameLoginUser ) {
        errors.login = 'Login is already exists';
      }
      if (Object.entries(errors).length > 0) {
        return res.status(400).send({ errors });
      }

      const user = new User();
      user.login = login;
      user.password = await bcrypt.hash(password, saltRounds);

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

    const users = await User.find();

    if (users.length <= 0) {
      const user = new User();
      user.login = login;
      user.password =  await bcrypt.hash(password, saltRounds);
      await user.save();
    }

    try {
      const user = await User.findOne({ 'login': login }).select('+password');

      const result = await bcrypt.compare(password, user.password);

      if (result) {
        const token = jwt.sign({ _id: user._id }, jwtConfig.secret, {
          expiresIn: 86400 * 365 // expires in 24 hours
        });
        res.send({
          _id: user._id,
          login: user.login,
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
