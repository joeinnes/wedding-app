const date = new Date(process.env.WEDDING_DATE)
const huFormat = new Intl.DateTimeFormat('hu-HU', {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
})
const enFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
})

const date_en = enFormat.format(date)
const date_hu = huFormat.format(date)

const fs = require('fs')
const rawData = fs.readFileSync(__dirname + '/rawData.json', 'utf-8')

module.exports = JSON.parse(rawData, function(key, value) {
  try {
    if (value.indexOf("${") > -1) {
      // Yes, eval is evil, but honestly, the spreadsheet with the translations is not open to user input,
      // and this is the best way to keep it maintainable without all translations being stored in a DB
      // which would be complicated and slow
      return eval('`' + value + '`')
    }
    return value
  } catch (e) {
    return value
  }
})