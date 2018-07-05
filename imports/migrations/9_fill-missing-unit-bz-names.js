import { Migrations } from 'meteor/percolate:migrations'
import { callAPI } from '../util/bugzilla-api'
import UnitMetaData from '../api/unit-meta-data'

Migrations.add({
  version: 9,
  up: () => {
    const listResponse = callAPI('get', '/rest/product_selectable', {}, true, true)
    const { ids } = listResponse.data
    const idsQueryParams = ids.map(id => `ids=${id}`).join('&')
    const unitDataUri = `/rest/product?${idsQueryParams}&include_fields=${['name,id'].join(',')}`
    const dataReponse = callAPI('get', unitDataUri, {}, true, true)
    const { products: units } = dataReponse.data
    units.forEach(({ id, name }) => {
      UnitMetaData.update({
        bzId: id,
        bzName: {
          $exists: false
        }
      }, {
        $set: {
          bzName: name
        }
      })
    })
  },
  down: () => {
    // No point of down, the migration just completes missing data, not changing the schema
  }
})
