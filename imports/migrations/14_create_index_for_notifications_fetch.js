import { Migrations } from 'meteor/percolate:migrations'
import CaseNotifications from '../api/case-notifications'

Migrations.add({
  version: 14,
  up: () => {
    CaseNotifications.rawCollection().createIndex({ userId: 1, createdAt: -1 })
  },
  down: () => {
    CaseNotifications.rawCollection().dropIndex({ userId: 1, createdAt: -1 })
  }
})
