import { Mongo } from 'meteor/mongo'

export const collectionName = 'unitRolesData'
export const possibleRoles = [
  {
    name: 'Tenant',
    canBeOccupant: true
  },
  {
    name: 'Owner/Landlord',
    canBeOccupant: true
  },
  {
    name: 'Contractor'
  },
  {
    name: 'Management Company'
  },
  {
    name: 'Agent'
  }
]

const UnitRolesData = new Mongo.Collection(collectionName)

export default UnitRolesData
