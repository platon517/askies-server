const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const jwtConfig = require('../config/jwtConfig');

module.exports = async (req, res) => {

  const { token } = req.headers;

  const users = await User.find({});
  if (users.length <= 0) {
    return true;
  }

  if (!token) return res.status(400).send('No token provided');
  try {
    const decoded = await jwt.verify(token, jwtConfig.secret);
    try {
      req.tokenUser = await User.findOne({ '_id': decoded._id });
      return true;
    } catch (e) {
      return res.status(400).send('User not found');
    }
  } catch (e) {
    return res.status(401).send('Failed to authenticate token.');
  }

};
