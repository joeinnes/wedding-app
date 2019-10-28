const UserController = require("../controllers/UserController.js")
const TokenController = require("../controllers/TokenController.js")

module.exports = async function(req, res, next) {
  
  // This module is slow... good target for refactoring for performance
  // Currently, it's loading all of the translations into the res, and 
  // making sure all session data is up to date, but seems clumsy
  if (!req.session.lang) {
    if (req.session.user) {
      req.session.lang = req.session.user.Language  
    } else {
      req.session.lang = req.query.lang || "en"
    }
  }
  
  res.locals = {
    ...res.locals,
    ...require("../i18n/translations.js")[req.session.lang]
  }
  
  if (!req.session.user) {
    next()
    return
  }
  req.session.user = await UserController.GetUserById(req.session.user._id)
  
  res.locals.user = req.session.user
  
  if (req.path !== "/logout") {
    const tokenValid = await TokenController.ValidateToken(
      req.session.user.Email,
      req.session.user.Token
    )

    if (!tokenValid) {
      res.redirect("/logout")
    }
  }
  next()
}
