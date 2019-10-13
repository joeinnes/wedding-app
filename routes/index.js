const express = require("express")
const router = express.Router()
const UserController = require("../controllers/UserController.js")
const TokenController = require("../controllers/TokenController.js")
const multer = require("multer")
const upload = multer()
const refreshUser = require('../middleware/refreshUser.js')

router.get("/", (req, res) => {
  res.render("index")
})

router.use("/logout", UserController.LogOut)
router.use("/login/:token", UserController.LogIn)
router.use("/send-token", TokenController.SendToken)
router.post("/rsvp", upload.none(), UserController.SetRsvps)

router.use("/guests", UserController.GuestList)

router.use("/set-lang/:lang", UserController.SetLang)

router.get("*", refreshUser, async function(req, res) {
  try {
    const path = req.path.substr(1)
    res.render(path, {}, (err, html) => {
      if (err) {
        res.render("error", {
          error: "Sorry, that page doesn't exist (or hasn't been built yet)"
        }) 
      } else {
        res.send(html)
      }
    })
  } catch (e) {
    res.render("error", {
      error: "Sorry, that page doesn't exist (or hasn't been built yet)"
    })
  }
})

module.exports = router