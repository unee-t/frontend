export function domain (service) {
  return process.env.STAGE ? `${service}.${process.env.STAGE}.${process.env.DOMAIN}` : `${service}.${process.env.DOMAIN}`
}

export default {
  domain
}
