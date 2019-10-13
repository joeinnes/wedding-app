const crypto = require("crypto")
const helpers = require("../helpers/index.js")
const UserController = require("./UserController.js")
const translations = require("../i18n/translations.js")

exports.ValidateToken = async function(email, token) {
  try {
    const user = await UserController.GetUserByEmail(email)
    let yesterday = new Date()
    let tokenDate = new Date(user["Token Date"])
    yesterday = yesterday.setDate(yesterday.getDate() - 1)
    if (tokenDate < yesterday) {
      return false
    }
    return token === user.Token
  } catch (e) {
    console.error(e)
  }
}

exports.GenerateToken = async function(id, email) {
  try {
    const user = await UserController.GetUserByEmail(email)
    if (user.Email !== email || user._id !== id) {
      throw new Error("Email address or user ID incorrect")
    }
    const string = id + email + process.env.SECRET + new Date().toUTCString()
    const newToken = crypto
      .createHash("md5")
      .update(string)
      .digest("hex")
    const payload = {
      Token: newToken,
      "Token Date": new Date()
    }
    const result = await helpers.updateRecord("Users", id, payload)
    return newToken
  } catch (e) {
    console.error(e)
  }
}

exports.SendToken = async function(req, res) {
  try {
    const email = req.query.email
    const user = await UserController.GetUserByEmail(email)
    if (!user) {
      throw translations[req.session.lang].noSuchUser
    }
    const newToken = await exports.GenerateToken(user._id, email)
    const url = `${process.env.BASEURL}/login/${newToken}?email=${email}`
    const appName = translations[req.session.lang].appName
    const to = email
    const subject = appName + " " + translations[req.session.lang].logIn
    const body = `${translations[req.session.lang].hi} ${
      user.Name.split(" ")[0]
    },<br/>
<br/>
        ${translations[req.session.lang].linkForLogIn}.<br/>
<br/>
        <a href="${url}">${subject}</a><br/>
<br/>
        ${translations[req.session.lang].browserCopy}<br/>
<br/>
        <a href="${url}">${url}</a><br/>
<br/>
${translations[req.session.lang].bestRegards}<br/>
${process.env.NAME_1} ${translations[req.session.lang].and} ${
      process.env.NAME_2
    }`
    const mailOptions = {
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: body
    }
    helpers.emailSender(mailOptions)
    res.render("token-sent")
  } catch (e) {
    console.error(e)
    res.render("error", { error: e })
  }
}
