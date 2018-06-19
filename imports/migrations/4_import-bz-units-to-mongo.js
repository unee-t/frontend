import { Migrations } from 'meteor/percolate:migrations'
import { callAPI } from '../util/bugzilla-api'
import UnitMetaData from '../api/unit-meta-data'
import UnitRolesData, { possibleRoles } from '../api/unit-roles-data'

Migrations.add({
  version: 4,
  up: () => {
    const listResponse = callAPI('get', '/rest/product_selectable', {}, true, true)
    const { ids } = listResponse.data
    const idsQueryParams = ids.map(id => `ids=${id}`).join('&')
    const unitDataUri = `/rest/product?${idsQueryParams}&include_fields=${['name,id'].join(',')}`
    const dataReponse = callAPI('get', unitDataUri, {}, true, true)
    const { products: units } = dataReponse.data
    units.forEach(({ id, name }) => {
      const unitMongoId = UnitMetaData.insert({
        bzId: id,
        bzName: name,
        displayName: '',
        streetAddress: '',
        city: '',
        zipCode: '',
        state: '',
        country: ''
      })
      possibleRoles.forEach(({ name: roleName }) => {
        UnitRolesData.insert({
          unitId: unitMongoId,
          unitBzId: id,
          roleType: roleName,
          defaultAssigneeId: -1,
          members: [] /*
            Contains objects of the form {
              id: user's mongo _id,
              isOccupant: Boolean,
              isVisible: Boolean (is publicly visible),
              isDefaultInvited: Boolean (is invited to new cases by default)
            }
          */
        })
      })
    })
  },
  down: () => {
    UnitMetaData.remove({})
    UnitRolesData.remove({})
  }
})
