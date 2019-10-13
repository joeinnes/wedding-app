// server.js
// where your node app starts

// init project
const express = require("express")
const app = express()
const session = require("express-session")
const SQLiteStore = require("connect-sqlite3")(session)
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const UserController = require("./controllers/UserController.js")
const multer = require("multer")
const upload = multer()

// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"))

app.use(
  bodyParser.urlencoded({
    extended: true
  })
)
app.use(bodyParser.json())
app.use(cookieParser())
app.use(
  session({
    store: new SQLiteStore({
      dir: "./db",
      db: "sessions.sqlite"
    }),
    secret: process.env.SECRET,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
    key: "user_id"
  })
)

// Middleware to log out users using expired tokens and populate session data
app.use(async function(req, res, next) {
  const user = req.session.user
  if (user && req.path !== "/logout") {
    const tokenValid = await UserController.validateToken(
      user.Email,
      user.Token
    )
    // Make current user available in PUG even if not manually passed
    res.locals.user = req.session.user
    if (!tokenValid) {
      return res.redirect("/logout")
    }
  }
  req.session.lang = user ? user.Language || "en" : "en"
  res.locals = {
    ...res.locals,
    ...require("./i18n/translations.js")[req.session.lang]
  }
  next()
})

app.use(async function(req, res, next) {
  if (!req.session.user) {
    next()
    return
  }
  const userId = req.session.user._id
  const user = await UserController.getUserById(userId)
  const plusOnes = Promise.all(
    user["Plus Ones"].map(async plusOne => {
      const plusOneDetails = await UserController.getUserById(plusOne)
      return {
        Name: plusOneDetails.Name,
        RSVP: plusOneDetails.RSVP,
        RSVPResponded: plusOneDetails.RSVPResponded,
        _id: plusOneDetails._id
      }
    })
  )
  req.session.user = user
  req.session.user.plusOnes = await plusOnes
  next()
})

// Make some environment variables available in the REQ object
app.locals.env = {
  name1: process.env.NAME_1,
  name2: process.env.NAME_2,
  weddingDate: process.env.WEDDING_DATE,
  bg: `bg-${process.env.PRIMARY_COLOUR}-${process.env.PRIMARY_SAT} text-white`,
  bgImage: `${process.env.BG_IMAGE}`,
  colour: process.env.PRIMARY_COLOUR,
  sat: process.env.PRIMARY_SAT
}

app.set("view engine", "pug")

app.get("/", (req, res) => {
  if (req.session.user) {
    res.render("index")
  } else {
    res.render("index", { title: "Hey", message: "You are not logged in." })
  }
})

app.get("/qrcode", (req, res) => {
  res.render("qrcode")
})

app.get("/whoami", (req, res) => {
  res.send(`You are ${req.session.user}!`)
})

app.get("/logout", (req, res) => {
  delete req.session.user
  delete res.locals.user
  res.redirect("/")
})

app.get("/login", async (req, res) => {
  if (req.session.user) {
    res.redirect("/")
  } else {
    res.render("login")
  }
})

app.get("/login/:token", async (req, res) => {
  const token = req.params.token
  const email = req.query.email
  const tokenValid = await UserController.validateToken(email, token)
  if (tokenValid) {
    const user = await UserController.getUserByEmail(email)
    const plusOnes = Promise.all(
      user["Plus Ones"].map(async plusOne => {
        const plusOneDetails = await UserController.getUserById(plusOne)
        return {
          Name: plusOneDetails.Name,
          RSVP: plusOneDetails.RSVP,
          RSVPResponded: plusOneDetails.RSVPResponded,
          _id: plusOneDetails._id
        }
      })
    )
    req.session.user = user
    req.session.user.plusOnes = await plusOnes
    res.redirect("/")
  } else {
    res.render("error", { error: "This link has expired!" })
  }
})

app.get("/send-token", async (req, res) => {
  try {
    const email = req.query.email
    const user = await UserController.getUserByEmail(email)
    if (!user) {
      throw `Hmm, that email address doesn't seem to be registered. Best to check with ${process.env.NAME_1} or ${process.env.NAME_2} whether they've updated your email address properly in the system.`
    }
    const newToken = await UserController.generateToken(user._id, email)
    await UserController.sendToken(email, newToken)
    res.render("token-sent")
  } catch (e) {
    console.error(e)
    res.render("error", { error: e })
  }
})

app.get("/rsvp", async (req, res) => {
  try {
    const user = req.session.user
    res.render("rsvp", {
      yes: user.RSVP
    })
  } catch (e) {
    console.error(e)
    res.render("error", {
      error: e
    })
  }
})

app.post("/rsvp", upload.none(), async (req, res) => {
  try {
    const rsvpsToProcess = req.body
    const user = req.session.user

    for (let rsvp in rsvpsToProcess) {
      const id = rsvp
      const response = rsvpsToProcess[id]
      if (response === "rsvp-yes") {
        await UserController.setRsvp(rsvp, true, user)
        res.sendStatus(200)
      } else if (response === "rsvp-no") {
        await UserController.setRsvp(rsvp, false, user)
        res.sendStatus(200)
      } else {
        throw "You can only pick yes or no for your RSVP"
        res.sendStatus(400)
      }
    }
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  }
})

app.get("/guests", async (req, res) => {
  try {
    const user = req.session.user
    if (!user) {
      res.render("error", {
        error: "You can only see the guest list if you log in."
      })
      return
    }
    const guestList = await UserController.fetchAll()
    const guestListSafe = guestList
      .filter(guest => {
        if (user.admin) {
          return guest
        }
        return guest.Table === user.Table
      })
      .map(guest => {
        let safeObj = {
          Name: guest.Name,
          RSVP: guest.RSVP,
          RSVPResponded: guest.RSVPResponded,
          Table: guest.Table
        }
        return safeObj
      })
      .sort((a, b) => {
        if (user.admin) {
          return a.Table.localeCompare(b.Table)
        } else {
          return a.Name.localeCompare(b.Name)
        }
      })
    res.render("guests", {
      guests: guestListSafe
    })
  } catch (e) {
    res.render("error", {
      error: e
    })
  }
})

app.get("/set-lang/:lang", async function(req, res) {
  try {
    const lang = req.params.lang
    console.log(lang)
    const user = req.session.user
    await UserController.setLang(user, lang)
    res.redirect("/")
  } catch (e) {
    console.error(e)
    res.sendStatus(500)
  }
})

app.get("*", function(req, res) {
  res.render("error", {
    error: "Sorry, that page doesn't exist (or hasn't been built yet)"
  })
})

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port)
})
