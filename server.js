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
const TokenController = require("./controllers/TokenController.js")
const router = require("./routes/index.js")
const refreshUser = require("./middleware/refreshUser.js")

// Make some environment variables available in the app
app.set("view engine", "pug")
app.locals.env = {
  name1: process.env.NAME_1,
  name2: process.env.NAME_2,
  weddingDate: process.env.WEDDING_DATE,
  bg: `bg-${process.env.PRIMARY_COLOUR}-${process.env.PRIMARY_SAT} text-white`,
  bgImage: `${process.env.BG_IMAGE}`,
  colour: process.env.PRIMARY_COLOUR,
  sat: process.env.PRIMARY_SAT
}
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
    const tokenValid = await TokenController.ValidateToken(
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

app.use(refreshUser)

app.use("/", router)

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port)
})
