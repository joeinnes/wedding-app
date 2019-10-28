const express = require('express')
const router = express.Router()
const UserController = require('../controllers/UserController.js')
const TokenController = require('../controllers/TokenController.js')
const LocationController = require('../controllers/LocationController.js')
const multer = require('multer')
const upload = multer()
const refreshUser = require('../middleware/refreshUser.js')
const QR = require('qrcode')

router.get('/', (req, res) => {
  res.render('index')
})

router.use('/logout', UserController.LogOut)
router.use('/login/:token', UserController.LogIn)
router.use('/send-token', TokenController.SendToken)

router.post('/rsvp', upload.none(), UserController.SetRsvps)
router.post('/set-address', upload.none(), UserController.UpdateAddress)

router.use('/guests', UserController.GuestList)
router.use('/set-lang/:lang', UserController.SetLang)

router.use('/location', LocationController.getLocation)
router.get('/qrcodeimg/:data', async (req, res) => {
  try {
    const code = await QR.toDataURL(req.params.data)
    const img = new Buffer(code.replace(/^data:image\/png;base64,/, ''), 'base64')
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': img.length
    })
    res.end(img)
  } catch (err) {
    console.error(err)
  }
})

router.get('*', refreshUser, async function(req, res) {
  try {
    const path = req.path.substr(1)
    res.render(path, {
      params: req.params,
      query: req.query
    }, (err, html) => {
      if (err) {
        console.log(err)
        res.render('error', {
          error: "Sorry, that page doesn't exist (or hasn't been built yet)"
        })
      } else {
        res.send(html)
      }
    })
  } catch (e) {
    res.render('error', {
      error: "Sorry, that page doesn't exist (or hasn't been built yet)"
    })
  }
})

const stdRouter = express.Router()
stdRouter.use('/set-lang/:lang', UserController.SetLang)
stdRouter.get('*', (req, res) => {
  res.render('savethedate', {
     email: req.query.email
  })
})

if (process.env.SAVE_THE_DATE === 'on') {
  module.exports = stdRouter
} else {
  module.exports = router
}
