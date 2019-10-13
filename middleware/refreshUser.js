const UserController = require("../controllers/UserController.js")

module.exports = async function(req, res, next) {
  if (!req.session.user) {
    next()
    return
  }
  const userId = req.session.user._id
  const user = await UserController.GetUserById(userId)
  req.session.user = user
  next()
}