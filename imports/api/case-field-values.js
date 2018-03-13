import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { callAPI } from '../util/bugzilla-api'

import { caseServerFieldMapping, caseClientFieldMapping } from './cases'

export const collectionName = 'caseFieldValues'

if (Meteor.isServer) {
  Meteor.publish(`${collectionName}.fetchByName`, function (name) {
    if (!this.userId) {
      this.ready()
      this.error(new Meteor.Error({message: 'Authentication required'}))
      return false
    }
    const {bugzillaCreds: { token }} = Meteor.users.findOne(this.userId)
    const serverName = caseServerFieldMapping[name]
    try {
      const {data: {fields: [fieldMeta]}} = callAPI('get', `/rest/field/bug/${serverName}`, {token}, false, true)
      this.added(collectionName, fieldMeta.id.toString(), {...fieldMeta, name: caseClientFieldMapping[fieldMeta.name]})
      this.ready()
    } catch (e) {
      console.error('API error encountered', e, `${collectionName}.fetchByName`, this.userId)
      this.ready()
      this.error(new Meteor.Error({message: 'API Error'}))
    }
  })
}

let CaseFieldValues
if (Meteor.isClient) {
  CaseFieldValues = new Mongo.Collection(collectionName)
}
export default CaseFieldValues
