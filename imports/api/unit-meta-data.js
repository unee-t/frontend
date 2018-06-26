import { Mongo } from 'meteor/mongo'

export const collectionName = 'unitMetaData'
export const unitTypes = Object.freeze([
  {
    name: 'Apartment/Flat'
  },
  {
    name: 'House'
  },
  {
    name: 'Villa'
  },
  {
    name: 'Office'
  },
  {
    name: 'Hotel'
  },
  {
    name: 'Hotel Room'
  },
  {
    name: 'Shop'
  },
  {
    name: 'Salon'
  },
  {
    name: 'Restaurant/Cafe'
  },
  {
    name: 'Condominium'
  },
  {
    name: 'Apartment Block'
  },
  {
    name: 'Warehouse'
  },
  {
    name: 'Shopping Mall'
  },
  {
    name: 'Other'
  }
])

const UnitMetaData = new Mongo.Collection(collectionName)

export default UnitMetaData
