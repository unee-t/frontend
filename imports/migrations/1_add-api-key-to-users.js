import { Meteor } from 'meteor/meteor'
import { HTTP } from 'meteor/http'
import randToken from 'rand-token'
import { Migrations } from 'meteor/percolate:migrations'

const { APIENROLL_LAMBDA_URL, API_ACCESS_TOKEN } = process.env
if (API_ACCESS_TOKEN && APIENROLL_LAMBDA_URL) {
  Migrations.add({
    version: 1,
    up: () => {
      Meteor.users.find({
        'bugzillaCreds.apiKey': { $exists: false }
      }, {
        fields: {
          'bugzillaCreds.id': 1
        }
      }).forEach(user => {
        const apiKey = randToken.generate(16)
        Meteor.users.update(user._id, {
          $set: {
            'bugzillaCreds.apiKey': apiKey
          },
          $unset: {
            'bugzillaCreds.token': 1
          }
        })
        HTTP.call('POST', APIENROLL_LAMBDA_URL, {
          data: {
            userApiKey: apiKey,
            userId: user.bugzillaCreds.id.toString()
          },
          headers: {
            Authorization: `Bearer ${API_ACCESS_TOKEN}`
          }
        })
      })
    }
  })
}
