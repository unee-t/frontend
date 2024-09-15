import CaseNotifications from '../case-notifications'

// https://github.com/unee-t/frontend/issues/282
export default (req, res) => {
  if (req.query.accessToken !== process.env.API_ACCESS_TOKEN) {
    res.send(401)
  }

  var oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const query = { createdAt: {} }
  query.createdAt['$gte'] = oneWeekAgo

  if (!req.query.userid) {
    res.send(400, 'userid missing')
  }

  query.userId = req.query.userid

  if (req.query.from) { query.createdAt['$gte'] = new Date(req.query.from) }
  if (req.query.to) { query.createdAt['$lte'] = new Date(req.query.to) }

  console.log('digest', query)

  res.send(CaseNotifications.find(query).fetch())
}
