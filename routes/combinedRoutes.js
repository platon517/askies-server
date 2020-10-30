const usersRoutes = require("./usersRoutes");
const entityRoutes = require("./entityRoutes");
const shopRoutes = require("./shopsRoutes");
const categoryRoutes = require("./categoryRoutes");
const optionRoutes = require("./optionRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const promoCodeRoutes = require("./promoCodeRoutes");
const appUserRoutes = require("./appUserRoutes");

module.exports = (app) => {
  usersRoutes(app);
  entityRoutes(app);
  shopRoutes(app);
  shopRoutes(app);
  categoryRoutes(app);
  optionRoutes(app);
  productRoutes(app);
  orderRoutes(app);
  paymentRoutes(app);
  promoCodeRoutes(app);
  appUserRoutes(app);
};
