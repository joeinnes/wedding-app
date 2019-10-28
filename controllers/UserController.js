const crypto = require("crypto")
const helpers = require("../helpers/index.js")
const translations = require("../i18n/translations.js")
const TokenController = require("./TokenController.js")

exports.GetUserByEmail = async function(email) {
  try {
    const user = await helpers.getUserByEmail(email)
    await exports.PopulatePlusOnes(user)
    return user
  } catch (e) {
    console.error(e)
  }
}

exports.GetUserById = async function(id) {
  try {
    const user = await helpers.getUserById(id)
    await exports.PopulatePlusOnes(user)
    return user
  } catch (e) {
    console.error(e)
  }
}

exports.SetLang = async function(req, res) {
  req.session.lang = req.params.lang
  console.log('Set lang ' + req.session.lang)
  
  const lang = req.params.lang
  try {
    const user = req.session.user
    if (!user) {
      res.redirect("/")
      return
    }
    const userId = user._id
    const payload = {
      Language: lang
    }
    const result = await helpers.updateRecord("Users", userId, payload)
    res.redirect("/")
  } catch (e) {
    console.error(e)
    res.render("error", { error: e })
  }
}

exports.SetRsvp = async function(userId, rsvp, currUser) {
  const user = await helpers.getUserById(userId)
  await exports.PopulatePlusOnes(user)

  if (userId !== user._id && currUser.plusOnes.includes(userId)) {
    throw translations[user.Language].notAuthorised
  }

  try {
    const payload = {
      RSVP: rsvp,
      RSVPResponded: true
    }
    return await helpers.updateRecord("Users", userId, payload)
  } catch (e) {
    console.error(e)
  }
}

exports.SetRsvps = async function(req, res) {
  try {
    const rsvpsToProcess = req.body
    const user = req.session.user

    for (let rsvp in rsvpsToProcess) {
      const id = rsvp
      const response = rsvpsToProcess[id]
      if (response === "rsvp-yes") {
        await exports.SetRsvp(rsvp, true, user)
      } else if (response === "rsvp-no") {
        await exports.SetRsvp(rsvp, false, user)
      } else {
        throw translations[req.session.lang].oddRsvp
      }
      if (id === user._id) {
        if (response === "rsvp-yes") {
          req.session.user.RSVP = true
        } else {
          req.session.user.RSVP = false
        }
      }
    }
    res.sendStatus(200)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  }
}

exports.FetchAll = async function(user) {
  try {
    const guests = await helpers.getAirtableRecords("users")
    let guestList = guests
      .map(guest => guest.fields)
      .map(guest => {
        delete guest.Token
        delete guest["Token Date"]
        return guest
      })
    if (user.admin) {
      return guestList.sort((a, b) => {
        a.Table.localeCompare(b.Table)
      })
    } else {
      return guestList
        .filter(guest => guest.Table === user.Table)
        .map(guest => ({
          Name: guest.Name,
          RSVP: guest.RSVP,
          RSVPResponded: guest.RSVPResponded
        }))
    }
  } catch (e) {
    console.error(e)
  }
}

exports.GuestList = async (req, res) => {
  try {
    const user = req.session.user
    if (!user) {
      res.render("error", {
        error: translations[req.session.lang].mustLogIn
      })
      return
    }
    const guestList = await exports.FetchAll(user)
    res.render("guests", {
      guests: guestList
    })
  } catch (e) {
    res.render("error", {
      error: e
    })
  }
}

exports.LogOut = async function(req, res) {
  delete req.session.user
  delete res.locals.user
  res.redirect("/")
}

exports.LogIn = async function(req, res) {
  const token = req.params.token
  const email = req.query.email
  const tokenValid = await TokenController.ValidateToken(email, token)
  if (tokenValid) {
    const user = await exports.GetUserByEmail(email)
    await exports.PopulatePlusOnes(user)
    req.session.user = user
    res.redirect("/")
  } else {
    res.render("error", { error: translations[req.session.lang].linkExpired })
  }
}

exports.PopulatePlusOnes = async function(user) {
  if (!user["Plus Ones"]) {
    return user
  }
  user.plusOnes = await Promise.all(
    user["Plus Ones"].map(async plusOne => {
      const plusOneDetails = await exports.GetUserById(plusOne)
      return {
        Name: plusOneDetails.Name,
        RSVP: plusOneDetails.RSVP,
        RSVPResponded: plusOneDetails.RSVPResponded,
        _id: plusOneDetails._id
      }
    })
  )
  return user
}


exports.UpdateAddress = async function(req, res) {
  try {
    const user = req.session.user
    const userId = user._id
    const addressDetails = req.body
    if (addressDetails.email !== user.Email) {
      throw "Can't update user!"
    }
    const payload = {
      Address1: req.body.address1,
      Address2: req.body.address2,
      Address3: req.body.address3,
      Address4: req.body.address4,
      Address5: req.body.address5
    }
    return await helpers.updateRecord("Users", userId, payload)
    res.sendStatus(200)
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  }
}