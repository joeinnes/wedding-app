const express = require("express")
const app = express()
const session = require("express-session")
const SQLiteStore = require("connect-sqlite3")(session)
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
const router = require("./routes/index.js")
const refreshUser = require("./middleware/refreshUser.js")

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
app.use(refreshUser)

app.use("/", router)

const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port)
})
