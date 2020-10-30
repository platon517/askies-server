const Entity = require('../models/entityModel');
const Order = require('../models/orderModel');
const Shop = require('../models/shopModel');
const Payment = require('../models/paymentModel');
const adminVerify = require('../helpers/adminVerify');

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
      try {
        console.log(req.body);
        await Order.updateOne({ paymentId: req.body.object.id }, { $set: { paid: true } });
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
