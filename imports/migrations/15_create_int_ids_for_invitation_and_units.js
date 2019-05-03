import { Migrations } from 'meteor/percolate:migrations'
import UnitMetaData, { collectionName as unitMetaCollName } from '../api/unit-meta-data'
import PendingInvitations, { collectionName as pendingInvitationsCollName } from '../api/pending-invitations'
import IncrementCounters from '../api/increment-counters'

Migrations.add({
  version: 15,
  up: () => {
    let unitCounter = 0
    let invCounter = 0
    UnitMetaData.find().forEach(doc => {
      doc.mefeUnitIdIntValue = ++unitCounter
      UnitMetaData.rawCollection().save(doc)
    })
    PendingInvitations.find().forEach(doc => {
      doc.mefeInvitationIdIntValue = ++invCounter
      PendingInvitations.rawCollection().save(doc)
    })

    IncrementCounters.upsert({
      _id: unitMetaCollName
    }, {
      $set: { counter: unitCounter }
    })

    IncrementCounters.upsert({
      _id: pendingInvitationsCollName
    }, {
      $set: { counter: invCounter }
    })
  },
  down: () => {
    UnitMetaData.update({}, {
      $unset: { mefeUnitIdIntValue: 1 }
    }, { multi: true })
    PendingInvitations.update({}, {
      $unset: { mefeInvitationIdIntValue: 1 }
    }, { multi: true })
    IncrementCounters.remove({ _id: { $in: [ unitMetaCollName, pendingInvitationsCollName ] } })
  }
})
