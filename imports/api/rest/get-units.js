import UnitMetaData from '../unit-meta-data'
import UnitRolesData from '../unit-roles-data'
import userApiKey from './middleware/user-api-key-middleware'

export default userApiKey((req, res) => {
  const { user, apiKeyDetails } = req

  const relevantRoles = UnitRolesData.find({
    'members.id': user._id
  }, {
    fields: {
      unitId: 1,
      roleType: 1
    }
  }).fetch()

  const rolesDict = relevantRoles.reduce((all, role) => {
    all[role.unitId] = role.roleType
    return all
  }, {})
  const unitsData = UnitMetaData.find({
    _id: {
      $in: relevantRoles.map(role => role.unitId)
    },
    ownerIds: apiKeyDetails.generatedBy
  }, {
    fields: {
      city: 1,
      country: 1,
      createdAt: 1,
      displayName: 1,
      moreInfo: 1,
      state: 1,
      streetAddress: 1,
      unitType: 1,
      zipCode: 1
    }
  }).fetch().map(unitMeta => ({
    ...unitMeta,
    designatedRole: rolesDict[unitMeta._id]
  }))

  res.send(200, unitsData)
})
