import { logger } from '../../util/logger'
import { createUnitItem } from '../units'

export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
    return
  }

  const payload = req.body

  switch (payload.actionType) {
    case 'CREATE_UNIT':
      const {
        creatorId, name, type, moreInfo, streetAddress, city, state, zipCode, country, ownerId
      } = payload
      let result
      try {
        result = createUnitItem(creatorId, name, type, moreInfo, streetAddress, city, state, zipCode, country, ownerId)
        res.send(200)
      } catch (e) {
        logger.error(e.message)
        res.send(400, e.message)
      }
      if (result) {
        result.liveUpdateFunc()
      }
      break
    default:
      const message = `Unrecognized actionType ${payload.actionType}`
      res.send(400, message)
      logger.log(message)
  }
}
