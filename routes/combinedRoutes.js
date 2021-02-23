const usersRoutes = require("./usersRoutes");
const askiesRoutes = require("./askiesRoutes");

module.exports = (app) => {
  usersRoutes(app);
  askiesRoutes(app);
};
