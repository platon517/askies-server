const axios = require('axios');
const AppUser = require('../models/appUserModel');

module.exports = app => {

  app.post('/phone', async (req, res) => {
    const phone = req.body.phone.replace(/[^0-9]/g, '');
    let appUser = await AppUser.findOne({ phone });
    if (!appUser) {
      appUser = new AppUser();
      appUser.phone = phone;
      await appUser.save();
    }

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

  app.get('/push-token/:appUser', async (req, res) => {
    const { appUser } = req.params;
    let user = await AppUser.findOne({ _id: appUser });

    if (!user) {
      return res.status(400).send('Пользователь не найден');
    }

    return res.send(user.pushToken);
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
      console.log('token:', token);
    } catch (e) {
      return res.status(400).send('Ошибка')
    }

    return res.send(user);
  });

};
