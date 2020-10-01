const { admin, entityAdmin, barista } = require('../constants/accountTypes');
const verification = require('./verification');
const User = require('../models/userModel');

module.exports = async (req, res) => {

  if (await verification(req, res)) {
    const { tokenUser } = req;

    try {
      const user = await User.findOne({ _id: tokenUser._id });
      if (user.accountType === admin) {
        return true;
      } else {
        return res.status(400).send({
          error: 'Not admin'
        })
      }
    } catch (e) {
      return res.status(400).send({
        error: 'error'
      })
    }
  } else {
    return res.status(400).send({
      error: 'error'
    })
  }

};
