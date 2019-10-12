const crypto = require("crypto")
const helpers = require("../helpers/index.js")
const translations = require("../i18n/translations.js")

module.exports = {
  async validateToken(email, token) {
    try {
      const user = await helpers.getUserByEmail(email)
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
  },

  async getUserByEmail(email) {
    try {
      return await helpers.getUserByEmail(email)
    } catch (e) {
      console.error(e)
    }
  },

  async setRsvp(userId, rsvp) {
    try {
      const payload = {
        RSVP: rsvp,
        RSVPResponded: true
      }
      const result = await helpers.updateRecord("Users", userId, payload)
    } catch (e) {
      console.error(e)
    }
  },

  async generateToken(id, email) {
    try {
      const user = await helpers.getUserByEmail(email)
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
  },

  async sendToken(email, token) {
    try {
      const user = await helpers.getUserByEmail(email)
      const lang = user.Language || "en"
      const url = `${process.env.BASEURL}/login/${token}?email=${email}`
      const appName = translations[lang].appName
      const to = email
      const subject = appName + " " + translations[lang].logIn
      const body = `${translations[lang].hi} ${user.Name.split(" ")[0]},<br/>
<br/>
        ${translations[lang].linkForLogIn}.<br/>
<br/>
        <a href="${url}">${subject}</a><br/>
<br/>
        ${translations[lang].browserCopy}<br/>
<br/>
        <a href="${url}">${url}</a><br/>
<br/>
${translations[lang].bestRegards}<br/>
${process.env.NAME_1} ${translations[lang].and} ${process.env.NAME_2}`
      const mailOptions = {
        from: process.env.FROM_EMAIL,
        to,
        subject,
        html: body
      }
      helpers.emailSender(mailOptions)
    } catch (e) {
      console.error(e)
    }
  },

  async fetchAll() {
    try {
      const guests = await helpers.getAirtableRecords("users")
      return guests
        .map(guest => guest.fields)
        .sort((a, b) => a.Name.localeCompare(b.Name))
    } catch (e) {
      console.error(e)
    }
  }
}
