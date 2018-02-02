import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { callAPI } from '../util/bugzilla-api'

const collectionName = 'caseFieldValues'
if (Meteor.isServer) {
  Meteor.publish(`${collectionName}.fetchByName`, function (name) {
    if (!this.userId) {
      this.ready()
      this.error(new Meteor.Error({message: 'Authentication required'}))
      return false
    }
    const {bugzillaCreds: { token }} = Meteor.users.findOne(this.userId)
    try {
      const {data: {fields: [fieldMeta]}} = callAPI('get', `/rest/field/bug/${name}`, {token}, false, true)
      this.added(collectionName, fieldMeta.id.toString(), fieldMeta)
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
