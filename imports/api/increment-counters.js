import { Mongo } from 'meteor/mongo'

export const collectionName = 'incrementCounters'

const IncrementCounters = new Mongo.Collection(collectionName)

export const getIncrementFor = incrementName => {
  IncrementCounters.update(
    { _id: incrementName },
    { $inc: { counter: 1 } },
    { upsert: true }
  )
  const updatedDoc = IncrementCounters.findOne({ _id: incrementName })
  return updatedDoc.counter
}

export default IncrementCounters
