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
    name: 'Room'
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

// TODO: Figure this out later
// export const formatAddressLabel = metaData => {
//   let fullLabel = ''
//   if (metaData.streetAddress) fullLabel += metaData.streetAddress + ', '
//   if (metaData.city && metaData.zipCode) {
//     fullLabel += `${metaData.city} ${metaData.zipCode}, `
//   } else if (metaData.city) {
//     fullLabel += metaData.city + ', '
//   } else if (metaData.zipCode) {
//     fullLabel += metaData.zipCode + ', '
//   }
//   // if (metaData.state)
//
//      // ${metaData.zipCode}`
// }

const UnitMetaData = new Mongo.Collection(collectionName)

export default UnitMetaData
