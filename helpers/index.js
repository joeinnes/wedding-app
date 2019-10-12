const Airtable = require("airtable")
const nodemailer = require("nodemailer")

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID)

module.exports = {
  getAirtableRecords(tableName, options = {}) {
    try {
      let records = [],
        params = {
          view: "Grid view",
          pageSize: 15
        }
      Object.assign(params, options)
      return new Promise((resolve, reject) => {
        // Cache results if called already
        if (records.length > 0) {
          resolve(records)
        }

        const processPage = (partialRecords, fetchNextPage) => {
          records = [...records, ...partialRecords]
          fetchNextPage()
        }

        const processRecords = err => {
          if (err) {
            reject(err)
            return
          }

          resolve(records)
        }

        base(tableName)
          .select(params)
          .eachPage(processPage, processRecords)
      })
    } catch (e) {
      console.error(e)
    }
  },

  getUserByEmail(email) {
    try {
      let records = [],
        params = {
          view: "Grid view",
          maxRecords: 3,
          filterByFormula: `{Email} = '${email}'`
        }
      return new Promise((resolve, reject) => {
        // Cache results if called already
        if (records.length > 0) {
          resolve(records[0].fields)
        }
        try {
          base("Users")
            .select(params)
            .firstPage((err, records) => {
              if (records[0]) {
                const returnVal = Object.assign(records[0].fields, { _id: records[0].id})
                resolve(returnVal)
                
              }
              reject("No such user")
            })
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      console.error(e)
    }
  },

  updateRecord(table, id, payload) {
    try {
      base(table).update(
        [
          {
            id: id,
            fields: payload
          }
        ],
        function(err, records) {
          if (err) {
            console.error(err)
            return
          }
          return records
        }
      )
    } catch (e) {
      console.error(e)
    }
  },

  emailSender(mailOptions) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.FROM_EMAIL,
          pass: process.env.FROM_PASS
        }
      })

      if (!mailOptions) {
        console.error("No mail options provided!")
      }

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error(err)
        }
      })
    } catch (e) {
      console.error(e)
    }
  }
}
