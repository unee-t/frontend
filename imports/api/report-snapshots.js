import { Mongo } from 'meteor/mongo'
import { Meteor } from 'meteor/meteor'
import { callAPI } from '../util/bugzilla-api'

export const collectionName = 'reportSnapshots'

const ReportSnapshots = new Mongo.Collection(collectionName)
if (Meteor.isServer) {
  Meteor.publish(`${collectionName}.byReportIdJustUrls`, function (reportId) {
    if (!this.userId) return
    const { bugzillaCreds: { apiKey } } = Meteor.users.findOne(this.userId)

    // Calling BZ API to authorize the current user
    try {
      callAPI('get', `/rest/bug/${reportId}`, {api_key: apiKey}, false, true)
    } catch (e) {
      console.error(`Unauthorized access to report ${reportId}`)
      return
    }

    return ReportSnapshots.find({'reportItem.id': parseInt(reportId)}, {
      fields: {
        previewUrl: 1,
        pdfUrl: 1,
        'reportItem.id': 1
      }
    })
  })
}

export default ReportSnapshots
