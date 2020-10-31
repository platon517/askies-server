const axios = require('axios');
const adminVerify = require('../helpers/adminVerify');
const verification = require('../helpers/verification');
const sendNotification = require('../helpers/sendNotification');
const Order = require('../models/orderModel');
const Shop = require('../models/shopModel');
const Entity = require('../models/entityModel');
const AppUser = require('../models/appUserModel');
const uniqid = require('uniqid');

axios.defaults.baseURL = 'https://payment.yandex.net/api/v3';

const { WAITING, COMPLETED, DECLINED, ACCEPTED, HIDDEN, PAYMENT_DECLINED } = require("../constants/orderStatuses");

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
    const { products, shop, waitTime, appUser, promoCode, savedMethodId = null } = req.body;

    let number;

    const generateNumber = async () => {
      number = Math.random()
        .toString(10)
        .substr(2, 6);

      const sameOrders = await Order.find({
        number,
        shop,
        status: { $in: [WAITING, ACCEPTED] }
      });

      if (sameOrders.length > 0) {
        return generateNumber();
      }

      const order = new Order();

      order.number = number;
      order.shop = shop;
      order.appUser = appUser;
      order.products = products;
      order.waitTime = waitTime;
      order.createdAt = new Date();
      order.status = WAITING;

      const user = await AppUser.findOne({ _id: appUser }).select('+paymentMethods');
      const shopObj = await Shop.findOne({ _id: shop });
      const entity = await Entity.findOne({ _id: shopObj.entity });

      if (promoCode) {
        if (entity.promoCode && entity.promoCode.equals(promoCode)) {
          order.promoCode = promoCode;
        }
      }

      await order.save();
      const savedOrder = await Order.findOne({ _id: order._id }).populate('products.product');

      const paymentMethod = user.paymentMethods.find(method => method._id.equals(savedMethodId));

      const data = {
        "amount": {
          "value": savedOrder.sum,
          "currency": "RUB"
        },
        "confirmation": {
          "type": paymentMethod ? "redirect" : "embedded",
          "return_url": "https://success.vendetta-coffee.ru"
        },
        "capture": false,
        "description": `Заказ #${number}`,
      };

      if (paymentMethod) {
        data.payment_method_id = paymentMethod.paymentId;
      }

      axios.post(`/payments/`, data, {
        headers: {
          'Idempotence-Key' : uniqid(),
        },
        auth: {
          username: entity.kassaShopId,
          password: entity.kassaApiToken
        }
      }).then(async response => {
        const updates = {};
        updates.paymentId = response.data.id;
        updates.paid = false;
        if (!paymentMethod) {
          updates.confirmationToken = response.data.confirmation.confirmation_token;
        }
        await Order.updateOne({ _id: savedOrder._id }, { $set: updates });

        const result = {};
        result._id = savedOrder._id;
        if (!paymentMethod) {
          result.confirmationToken = response.data.confirmation.confirmation_token;
        }
        return res.send(result);
      })
        .catch(err => console.log(err));
    };

    const selectedShop = await Shop.findOne({ _id: shop });
    if (selectedShop.isActive) {
      await generateNumber();
    } else {
      res.status(400).send('Кофейня закрыта');
    }
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
        const tasks = await Order
          .find({ shop: tokenUser.shop, status: { $in: [WAITING, ACCEPTED] }, paid: true })
          .populate('shop')
          .populate('products.product')
          .populate('products.options')
          .populate('products.volume')
          .sort('-createdAt');
        res.send(tasks);
      } catch (e) {
        res.status(400).send({
          error: 'Ошибка при получении задач'
        });
      }
    }
  });

  app.post("/tasks/:id/accept", async (req, res) => {
    const { id } = req.params;

    try {
      const order = await Order.findOne({ _id: id }).populate('appUser');
      const shopObj = await Shop.findOne({ _id: order.shop });
      const entity = await Entity.findOne({ _id: shopObj.entity });

      axios.post(`/payments/${order.paymentId}/capture/`, {}, {
        headers: {
          'Idempotence-Key' : uniqid(),
        },
        auth: {
          username: entity.kassaShopId,
          password: entity.kassaApiToken
        }
      }).then(async response => {
        //console.log(response.data);
        if ( response.data.status === 'succeeded' ) {
          await Order.updateOne({ _id: id }, { $set: { status: ACCEPTED } });

          await sendNotification({
            to: order.appUser.pushToken,
            sound: 'default',
            title: 'Заказ подтвержден',
            body: `Номер заказа: ${order.number}`,
            data: { type: 'ORDER', orderId: order._id },
            priority: 'high'
          });

          return res.send(order);
        } else {
          return res.status(400).send({
            error: 'Ошибка оплаты'
          });
        }
      }, error => {
        return res.status(400).send({
          error: 'Ошибка'
        });
      });
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка'
      });
    }

  });

  app.post("/tasks/:id/decline", async (req, res) => {
    const { id } = req.params;

    try {

      const order = await Order.findOne({ _id: id }).populate('appUser');
      const shopObj = await Shop.findOne({ _id: order.shop });
      const entity = await Entity.findOne({ _id: shopObj.entity });

      await Order.updateOne({ _id: id }, { $set: { status: DECLINED } });

      axios.post(`/payments/${order.paymentId}/cancel/`, {}, {
        headers: {
          'Idempotence-Key' : uniqid(),
        },
        auth: {
          username: entity.kassaShopId,
          password: entity.kassaApiToken
        }
      }).then(async response => {
        if ( response.data.status === 'canceled' ) {

          await sendNotification({
            to: order.appUser.pushToken,
            sound: 'default',
            title: 'Заказ отменен',
            body: `Ваш заказ был отменен кофейней`,
            data: { type: 'ORDER', orderId: order._id },
            priority: 'high'
          });

          return res.send(order);
        } else {
          await Order.updateOne({ _id: id }, { $set: { status: WAITING } });
          return res.status(400).send({
            error: 'Ошибка отмены'
          });
        }
      }, async error => {
        await Order.updateOne({ _id: id }, { $set: { status: WAITING } });
        return res.status(400).send({
          error: 'Ошибка'
        });
      });

    } catch (e) {
      res.status(400).send({
        error: 'Ошибка'
      });
    }

  });

  app.post("/tasks/:id/complete", async (req, res) => {
    const { id } = req.params;

    try {
      await Order.updateOne({ _id: id }, { $set: { status: COMPLETED } });
      const order = await Order.findOne({ _id: id });
      res.send(order);
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка'
      });
    }

  });

  app.post("/tasks/:id/hide", async (req, res) => {
    const { id } = req.params;

    try {
      await Order.updateOne({ _id: id }, { $set: { status: HIDDEN } });
      const order = await Order.findOne({ _id: id });
      res.send(order);
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка'
      });
    }

  });

  app.get("/orders/:appUser", async (req, res) => {
    try {
      const { appUser } = req.params;
      const orders = await Order
        .find({ appUser })
        .populate('shop')
        .populate('products.product')
        .populate('products.options')
        .populate('products.volume')
        .sort({
          _id: -1
        });
      res.send(
        orders.map(order =>
          (order.status === ACCEPTED || order.status === COMPLETED) ?
            order
            :
            {
              ...order.toObject(),
              number: (order.status === DECLINED || order.status === PAYMENT_DECLINED) ? 'Отменен' : 'Ожидается'
            }
          )
      );
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка сервера'
      });
    }
  });

  app.get("/orders/:id/:appUser", async (req, res) => {
    try {
      const { id, appUser } = req.params;
      const order = await Order
        .findOne({ _id: id, appUser })
        .populate('shop')
        .populate('promoCode')
        .populate('products.product')
        .populate('products.options')
        .populate('products.volume');

      const shop = await Shop.findOne({ _id: order.shop }).populate('entity');

      axios.get(`/payments/${order.paymentId}/`, {
        auth: {
          username: shop.entity.kassaShopId,
          password: shop.entity.kassaApiToken
        }
      })
        .then(async response => {
          if (response.data.paid) {
            try {
              await Order.updateOne({ _id: id }, { $set: { paid: true } });
              const resultOrder = await Order
                .findOne({ _id: id, appUser })
                .populate('shop')
                .populate('promoCode')
                .populate('products.product')
                .populate('products.options')
                .populate('products.volume');
              return res.send(resultOrder);
            } catch (e) {
              console.error(e);
            }
          } else {
            if (response.data.status === 'canceled' && order.status !== DECLINED) {
              try {
                await Order.updateOne({ _id: id }, { $set: { status: PAYMENT_DECLINED, } });
              } catch (e) {
                console.error(e);
              }
            }
            return res.send({...order.toObject(), number: ''});
          }
        });
    } catch (e) {
      res.status(400).send({
        error: 'Ошибка сервера'
      });
    }
  });

};
