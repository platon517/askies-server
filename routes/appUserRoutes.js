const axios = require('axios');
const AppUser = require('../models/appUserModel');
const Entity = require('../models/entityModel');
const adminVerify = require('../helpers/adminVerify');

module.exports = app => {

  app.post('/phone', async (req, res) => {
    const phone = req.body.phone.replace(/[^0-9]/g, '');
    let appUser = await AppUser.findOne({ phone });
    if (!appUser) {
      appUser = new AppUser();
      appUser.phone = phone;
      await appUser.save();
    }

    if ( phone === '99999' ) {
      await AppUser.update({ phone }, { $set: { smsCode: '0000', smsCodeCreatedAt: new Date() } });
      return res.send('ok');
    } else {
      if (
        appUser.smsCodeCreatedAt &&
        ((new Date().getTime() - appUser.smsCodeCreatedAt.getTime()) / 1000) < 60
      ) {
        return res.status(400).send(
          `Попробуйте через ${60 - Math.floor((new Date().getTime() - appUser.smsCodeCreatedAt.getTime()) / 1000)} секунд.`
        );
      }

      const code = Math.random()
        .toString(10)
        .substr(2, 4);

      await AppUser.update({ phone }, { $set: { smsCode: code, smsCodeCreatedAt: new Date() } });

      try {
        axios.post(
          `https://sms.ru/sms/send?api_id=B972154B-FB65-93CE-91F3-45B61F326E83&to=${phone}&msg=Code%3A+${code}&json=1&from=Coffeeget`
        ).then(response => {
          return res.send(response.data);
        }, error => {
          return res.status(400).send('Ошибка при отправке смс');
        });
        //res.send(code);
      } catch (e) {
        res.status(400).send('Ошибка при отправке смс');
      }
    }
  });

  app.post('/sms-code', async (req, res) => {
    const phone = req.body.phone.replace(/[^0-9]/g, '');
    const { code } = req.body;
    let appUser = await AppUser.findOne({ phone });

    if (!appUser) {
      return res.status(400).send('Пользователь не найден');
    }

    if ( appUser.smsCode === code ) {
      res.send(appUser._id);
    } else {
      res.status(400).send('Неверный код')
    }

  });

  app.post('/push-token/:appUser', async (req, res) => {
    const { appUser } = req.params;
    const { token } = req.body;
    let user = await AppUser.findOne({ _id: appUser });

    if (!user) {
      return res.status(400).send('Пользователь не найден');
    }

    try {
      await AppUser.updateOne({ _id: appUser }, { $set: { pushToken: token } });
      return res.send(token);
    } catch (e) {
      return res.status(400).send('Ошибка')
    }
  });

  app.get('/payment-methods/:appUser', async (req, res) => {
    const { appUser } = req.params;
    const { entity } = req.query;
    if (!appUser) {
      return res.status(400).send('Пользователь не найден');
    }
    try {
      let user = await AppUser.findOne({ _id: appUser }).select('+paymentMethods');
      if (user.paymentMethods) {
        const paymentMethods =
          user.paymentMethods
            .filter(method =>  method.entity && method.entity.equals(entity))
            .map(method => ({ _id: method._id, card: method.card }));
        return res.send(paymentMethods);
      }
      return res.send([]);
    } catch (error) {
      return res.status(400).send('error');
    }
  });

  app.delete('/payment-methods/:appUser/:id', async (req, res) => {
    const { appUser, id } = req.params;
    if (!appUser) {
      return res.status(400).send('Пользователь не найден');
    }
    try {
      await AppUser.updateOne({ _id: appUser }, { $pull: { paymentMethods: { _id: id } } });
      let user = await AppUser.findOne({ _id: appUser }).select('+paymentMethods');
      const paymentMethods = user.paymentMethods.map(method => ({ _id: method._id, card: method.card }));
      return res.send(paymentMethods);
    } catch (error) {
      return res.status(400).send('error');
    }
  });

  app.get('/app-users/count', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        let users = await AppUser.find();
        return res.send({ count: users.length });
      } catch (error) {
        return res.status(400).send('error');
      }
    }
  });

  app.get('/app-users/:id/free-order/:entityId', async (req, res) => {
    const { id, entityId } = req.params;
    try {
      let user = await AppUser.find({ _id: id });
      let entity = await Entity.find({ _id: entityId }).select('+freeOrderPaymentId');
      return res.send({ result: (!user.freeOrderUsed) });
    } catch (error) {
      return res.status(400).send('error');
    }
  });

};
