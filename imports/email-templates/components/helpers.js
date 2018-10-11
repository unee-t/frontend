import URL from 'url'
import { URL as url2 } from 'meteor/url'
import { footer } from '../../ui/util/marketing'

export function resolveUserName (user) {
  return `${user.profile.name || user.emails[0].address.split('@')[0]}`
}

// We can use this to actually see how users engaged with emails
// https://github.com/unee-t/engagement
export function createEngagementLink (params) {
  // where to: url
  // who: email
  // why: notification id
  const engagementURL = URL.parse(resolveServiceDomain('e'))
  engagementURL.search = url2._encodeParams(params)
  return URL.format(engagementURL)
}

function resolveServiceDomain (service) {
  const domain = process.env.STAGE ? `${service}.${process.env.STAGE}.${process.env.DOMAIN}` : `${service}.${process.env.DOMAIN}`
  return URL.format('https://' + domain)
}

export function optOutHtml (settingType, notificationId, user, optoutUrl) {
  return (`
<p>
${footer}
</p>
    <p>
      To opt out of receiving "${settingType}" emails, please visit
      <a href='${
    createEngagementLink({
      url: URL.resolve(process.env.ROOT_URL, '/notification-settings'),
      id: notificationId,
      email: user.emails[0].address
    })
    }'>
        ${URL.resolve(process.env.ROOT_URL, '/notification-settings')}
      </a>
    </p>
  `)
}

export function optOutText (settingType, notificationId, user, optoutUrl) {
  return (`
--
${footer}

To opt out of receiving "${settingType}" emails, please visit
    ${createEngagementLink({
      url: URL.resolve(process.env.ROOT_URL, '/notification-settings'),
      id: notificationId,
      email: user.emails[0].address
    })}
 `)
}
