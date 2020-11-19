const axios = require('axios');
const Entity = require('../models/entityModel');
const Order = require('../models/orderModel');
const Shop = require('../models/shopModel');
const Payment = require('../models/paymentModel');
const AppUser = require('../models/appUserModel');
const adminVerify = require('../helpers/adminVerify');
const sendNotification = require('../helpers/sendNotification');
const uniqid = require('uniqid');

module.exports = app => {

  app.get('/payments/entities', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const entities = await Entity.find({}).exec();

        const results = [];
        for (let entity of entities) {
          const entityObj = entity.toObject();
          const shops = await Shop.find({ entity: entity._id });
          const orders = await Order.find({ shop: { $in: shops.map(shop => shop._id) }, paid: true }).populate('shop');
          const payments = await Payment.find({ entity: entity._id });
          entityObj.processedPaymentsSum = payments
            .reduce((acc, payment) => {
              acc += parseFloat(payment.sum);
              return acc;
            }, 0).toFixed(2);
          entityObj.totalPaymentsSum = (orders
            .reduce((acc, order) => {
              console.log(order);
              acc += (parseFloat(order.sum) * (parseFloat(order.shop.commission || 0) / 100));
              return acc;
            }, 0)).toFixed(2);
          entityObj.waitingPaymentsSum =
            (parseFloat(entityObj.totalPaymentsSum) - parseFloat(entityObj.processedPaymentsSum)).toFixed(2);

          results.push(entityObj);
        }
        return res.send(
          results.sort((a, b) => parseFloat(b.waitingPaymentsSum) - parseFloat(a.waitingPaymentsSum))
        );
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/payments', async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { entity, sum } = req.body;
        if (!entity || !sum) {
          return res.status(400).send({'error': 'Заполните все поля'});
        }
        const payment = new Payment();
        payment.entity = entity;
        payment.sum = sum;
        payment.createdAt = new Date();
        await payment.save();
        return res.send(payment);
      } catch (e) {
        return res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

  app.post('/payments/notifications', async (req, res) => {
    if (req.body.event === 'payment.waiting_for_capture') {
      if (req.body.object.description === 'CARD_BINDING') {
        const { payment_method } = req.body.object;
        if (payment_method.saved && payment_method.type === 'bank_card') {
          const entity = await Entity.findOne({ freeOrderPaymentKassaId: req.body.object.id });

          await Entity.updateOne(
            { freeOrderPaymentKassaId: req.body.object.id },
            { $set: { freeOrderPaymentId: payment_method.id } }
          );
          axios.post(`/payments/${req.body.object.id}/cancel/`, {}, {
            headers: {
              'Idempotence-Key' : uniqid(),
            },
            auth: {
              username: entity.kassaShopId,
              password: entity.kassaApiToken
            }
          }).then(async response => {
            return res.send('OK');
          }).catch(err => {
            return res.status(400).send('Error');
          });
          console.log('CARD_BINDING', payment_method.id);
        }
      }
      try {
        await Order.updateOne({ paymentId: req.body.object.id }, { $set: { paid: true } });
        const order = await Order
          .findOne({ paymentId: req.body.object.id })
          .populate({ path: 'shop', select: '+employeesPhoneNumbers' });

        if (order.shop.employeesPhoneNumbers) {
          order.shop.employeesPhoneNumbers.map(async (phone) => {
            if (phone.isActive) {
              const appUser = await AppUser.findOne({ phone: phone.number });
              if (appUser && appUser.pushToken) {
                await sendNotification({
                  to: appUser.pushToken,
                  sound: 'default',
                  title: 'Поступил новый заказ',
                  body: `Номер заказа: ${order.number}`,
                  data: { type: 'BARISTA_ORDER' },
                  priority: 'high'
                });
              }
            }
          });
        }
        const { payment_method } = req.body.object;
        if (payment_method.saved && payment_method.type === 'bank_card') {
          const user = await AppUser.findOne({ _id: order.appUser }).select('+paymentMethods');
          if (!user.paymentMethods || !user.paymentMethods.find(method => method.paymentId === payment_method.id)) {
            await AppUser.updateOne(
              { _id: order.appUser },
              {
                $push: {
                  paymentMethods: {
                    paymentId: payment_method.id,
                    card: payment_method.card,
                    entity: order.shop.entity
                  }
                }
              }
            );
          }
        }
        return res.send('ok');
      } catch (e) {
        return res.status(400).send('Ошибка');
      }
    }
  });

  app.delete('/payments/:id', async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      try {
        await Payment.deleteOne({ _id: id });
        return res.send('OK');
      } catch (e) {
        res.status(400).send({'error': 'An error has occurred'});
      }
    }
  });

};
