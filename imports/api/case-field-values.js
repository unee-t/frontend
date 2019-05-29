import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { callAPI } from '../util/bugzilla-api'
import { logger } from '../util/logger'

import { caseServerFieldMapping, caseClientFieldMapping } from './cases'

export const collectionName = 'caseFieldValues'

// For some reason the field name on the API is bug_status, but "status" is used instead on the actual bug from the API
const serverLocalFieldMapping = Object.assign({}, caseServerFieldMapping, { status: 'bug_status' })
const clientLocalFieldMapping = Object.assign({}, caseClientFieldMapping, { bug_status: 'status' })

if (Meteor.isServer) {
  Meteor.publish(`${collectionName}.fetchByName`, function (name) {
    if (!this.userId) {
      this.error(new Meteor.Error({ message: 'Authentication required' }))
      return false
    }
    const { bugzillaCreds: { apiKey } } = Meteor.users.findOne(this.userId)
    const serverName = serverLocalFieldMapping[name]
    try {
      const { data: { fields: [fieldMeta] } } = callAPI(
        'get', `/rest/field/bug/${serverName}`, { api_key: apiKey }, false, true
      )
      const { values, ...fieldMetaRest } = fieldMeta
      const filteredMeta = {
        ...fieldMetaRest,
        values: values.filter(val => val.sortkey !== 9999)
      }

      this.added(collectionName, filteredMeta.id.toString(), { ...filteredMeta, name: clientLocalFieldMapping[fieldMeta.name] })
      this.ready()
    } catch (e) {
      logger.error('API error encountered', e, `${collectionName}.fetchByName`, this.userId)
      this.error(new Meteor.Error({ message: 'API Error' }))
    }
  })
}

let CaseFieldValues
if (Meteor.isClient) {
  CaseFieldValues = new Mongo.Collection(collectionName)
}
export default CaseFieldValues
