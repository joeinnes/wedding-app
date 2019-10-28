const helpers = require("../helpers/index.js")

exports.getLocation = async function (req, res) {
  const location = await helpers.getAirtableRecords("Location", {maxRecords: 1})
  res.render('location', {
    locationVal: location[0].fields
  })
}