import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { check } from 'meteor/check'
import bugzillaApi from '../util/bugzilla-api'
import { getUnitRoles } from './units'
import { caseServerFieldMapping } from './cases'

export const collectionName = 'reports'

Meteor.methods({
  [`${collectionName}.insert`] (params) {
    const { selectedUnit } = params
    check(params, {
      selectedUnit: String,
      title: String
    })
    if (!Meteor.userId()) {
      throw new Meteor.Error('not-authorized')
    }
    if (Meteor.isServer) {
      const { bugzillaCreds: { apiKey } } = Meteor.users.findOne(Meteor.userId())
      const { callAPI } = bugzillaApi

      let unitItem
      try {
        const requestUrl = `/rest/product?names=${encodeURIComponent(selectedUnit)}`
        const unitResult = callAPI('get', requestUrl, {api_key: apiKey}, false, true)
        unitItem = unitResult.data.products[0]
      } catch (e) {
        console.error(e)
        throw new Meteor.Error('API error')
      }
      const currUser = Meteor.user()
      const currUserRole = getUnitRoles(unitItem).find(role => role.login === currUser.bugzillaCreds.login)

      if (!currUserRole) {
        throw new Meteor.Error('not-authorized: The user must have a role in this unit')
      }

      console.log('Creating report', params)
      const normalizedParams = Object.keys(params).reduce((all, paramName) => {
        all[caseServerFieldMapping[paramName] || paramName] = params[paramName]
        return all
      }, {
        component: currUserRole.role,
        description: `Unee-T Inspection Report for the unit "${selectedUnit}"`,
        keywords: ['inspection_report'],
        status: 'UNCONFIRMED',
        api_key: apiKey,

        // Hardcoded values to avoid issues with BZ API "required" checks
        version: '---',
        op_sys: 'Unspecified', // NOTE: This might an actual value at a later evolution step of the app
        [caseServerFieldMapping.category]: '---',
        [caseServerFieldMapping.subCategory]: '---'
      })

      let newReportId
      try {
        const { data } = callAPI('post', '/rest/bug', normalizedParams, false, true)
        newReportId = data.id
        console.log(`a new report has been created by user ${Meteor.userId()}, report id: ${newReportId}`)
        // TODO: Add real time update handler usage
      } catch (e) {
        console.error({
          user: Meteor.userId(),
          method: `${collectionName}.insert`,
          args: [params],
          error: e
        })
        throw new Meteor.Error(`API Error: ${e.response.data.message}`)
      }
      return {newReportId}
    }
  }
})

let Reports
if (Meteor.isClient) {
  Reports = new Mongo.Collection(collectionName)
}

export default Reports
