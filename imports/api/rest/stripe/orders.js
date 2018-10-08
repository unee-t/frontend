import config from './config'
const stripe = require('stripe')(config.stripe.secretKey)
stripe.setApiVersion(config.stripe.apiVersion)
const {orders} = require('./inventory')

export default async (req, res) => {
  try {
    let {currency, items, email, shipping} = req.body
    let order = await orders.createOrder(currency, items, email, shipping)
    return res.send(200, order)
  } catch (err) {
    return res.send(500, err)
  }
}
