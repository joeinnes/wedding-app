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
    res.locals.user = user
    if (!tokenValid) {
      return res.redirect("/logout")
    }
  }
  req.session.lang = user ? user.Language || "en" : "en"
  res.locals = {...res.locals, ...require('./i18n/translations.js')[req.session.lang]}
  next()
})


// Make some environment variables available in the REQ object
app.locals.env = {
  name1: process.env.NAME_1,
  name2: process.env.NAME_2,
  weddingDate: process.env.WEDDING_DATE,
  bg: `bg-${process.env.PRIMARY_COLOUR}-500 text-white`,
  colour: process.env.PRIMARY_COLOUR
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
    req.session.user = user
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

app.get("/rsvp/:resp", async (req, res) => {
  try {
    const user = req.session.user
    const resp = req.params.resp
    if (resp === "yes") {
      await UserController.setRsvp(user._id, true)
      req.session.user.RSVP = true
      req.session.user.RSVPResponded = true
      res.render("rsvp", { yes: true })
    } else if (resp === "no") {
      await UserController.setRsvp(user._id, false)
      req.session.user.RSVP = false
      req.session.user.RSVPResponded = true
      res.render("rsvp")
    } else {
      res.render("error", {
        error: "You can only pick yes or no for your RSVP"
      })
    }
  } catch (e) {
    res.redirect("/")
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
    const guestListSafe = guestList.filter(guest => guest.Table === user.table).map(guest => {
      let safeObj = {
        Name: guest.Name,
        RSVP: guest.RSVP,
        RSVPResponded: guest.RSVPResponded
      }
      return safeObj
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

app.get("*", function(req, res) {
  res.render("error", {
    error: "Sorry, that page doesn't exist (or hasn't been built yet)"
  })
})

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port)
})
