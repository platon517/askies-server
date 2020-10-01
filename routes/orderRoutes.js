const axios = require('axios');
const adminVerify = require('../helpers/adminVerify');
const verification = require('../helpers/verification');
const Order = require('../models/orderModel');
const uniqid = require('uniqid');

axios.defaults.baseURL = 'https://payment.yandex.net/api/v3';
axios.defaults.auth = {
  username: '54401',
  password: 'test_Fh8hUAVVBGUGbjmlzba6TB0iyUbos_lueTHE-axOwM0'
};

const { WAITING, COMPLETED, CANCELLED, READY, HIDDEN } = require("../constants/orderStatuses");

const checkPayment = (orderId, paymentId, tryCount = 0) => {
  axios({
    method: 'get',
    url: `/payments/${paymentId}/`,
  })
    .then(async response => {
      if (tryCount < 60) {
        if (!response.data.paid) {
          setTimeout(() => checkPayment(orderId, paymentId, tryCount + 1), 5000)
        } else {
          await markOrderPaid(orderId);
        }
      }
    });
};

const markOrderPaid = async orderId => {

  try {
    await Order.updateOne({ _id: orderId }, { $set: { paid: true } });
  } catch (e) {
    console.error(e);
  }

};

module.exports = app => {

  app.get("/orders", async (req, res) => {
    if (await adminVerify(req, res)) {
      const { skip, limit, search = '' } = req.query;

      try {
        const totalOrders = await Order.find({});
        const orders = await Order
          .find({ number: {$regex : `.*${search}.*`, $options:'i'} })
          .populate('shop')
          .populate('products.product')
          .populate('products.options')
          .populate('products.volume')
          .sort({
            _id: -1
          })
          .skip(parseFloat(skip))
          .limit(parseFloat(limit));

        res.send(
          {
            data: orders,
            count: totalOrders.length
          }
        );
      } catch (e) {
        res.status(400).send({
          error: "Ошибка в заказах"
        });
      }
    }
  });

  app.post("/orders", async (req, res) => {
    const { products, shop, waitTime, deviceId } = req.body;

    let number;

    const generateNumber = async () => {
      number = Math.random()
        .toString(10)
        .substr(2, 6);

      const sameOrders = Order.find({
        number,
        shop,
        status: { $in: [COMPLETED, CANCELLED] }
      });

      if (sameOrders.length > 0) {
        return generateNumber();
      }

      const order = new Order();

      order.number = number;
      order.shop = shop;
      order.deviceId = deviceId;
      order.products = products;
      order.waitTime = waitTime;
      order.createdAt = new Date();
      order.status = WAITING;
      await order.save();
      const savedOrder = await Order.findOne({ _id: order._id }).populate('products.product');

      axios({
        method: 'post',
        url: '/payments',
        headers: {
          'Idempotence-Key' : uniqid(),
        },
        data:{
          "amount": {
            "value": savedOrder.sum,
            "currency": "RUB"
          },
          "confirmation": {
            "type": "embedded",
          },
          "capture": true,
          "description": `Заказ #${number}`,
          "save_payment_method": true,
        }
      })
        .then(async response => {
          await Order.updateOne({ _id: savedOrder._id }, { $set: {
              confirmationToken: response.data.confirmation.confirmation_token,
              paymentId: response.data.id,
              paid: false
          } });
          checkPayment(savedOrder._id, response.data.id);
          return res.send({
            _id: savedOrder._id,
            confirmation_token: response.data.confirmation.confirmation_token,
          });
        })
        .catch(err => console.log(err));

    };

    await generateNumber();
  });

  app.delete("/orders/:id", async (req, res) => {
    if (await adminVerify(req, res)) {
      try {
        const { id } = req.params;
        await Order.deleteOne({ _id: id });
        res.send('OK')
      } catch (e) {
        res.status(400).send({
          error: 'Ошибка при удалении заказа'
        });
      }
    }
  });

  app.get("/tasks/", async (req, res) => {
    if (await verification(req, res)) {
      try {
        const { tokenUser } = req;
        const tasks = await Order.find({ shop: tokenUser.shop, status: { $in: [WAITING, READY] }, paid: true })
        res.send(
          tasks.sort((a, b) => {
            const aTime = (new Date(a.date)).getTime() + parseFloat(a.time) * 60 * 1000 - Date.now();
            const bTime = (new Date(b.date)).getTime() + parseFloat(b.time) * 60 * 1000 - Date.now();
            return aTime - bTime;
          })
        )
      } catch (e) {
        res.status(400).send({
          error: 'Ошибка при получении задач'
        });
      }
    }
  });

  app.post("/tasks/:id/ready", (req, res) => {
    const { id } = req.params;

    try {
      Order.updateOne({ _id: id }, { $set: { status: READY } });
      res.send('OK');
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка'
      });
    }

  });

  app.post("/tasks/:id/complete", (req, res) => {
    const { id } = req.params;

    try {
      Order.updateOne({ _id: id }, { $set: { status: COMPLETED } });
      res.send('OK');
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка'
      });
    }

  });

  app.post("/tasks/:id/hide", (req, res) => {
    const { id } = req.params;

    try {
      Order.updateOne({ _id: id }, { $set: { status: HIDDEN } });
      res.send('OK');
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка'
      });
    }

  });

};
