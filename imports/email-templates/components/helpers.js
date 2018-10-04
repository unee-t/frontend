import URL from 'url'
import { URL as url2 } from 'meteor/url'
import { footer } from '../../ui/util/marketing'

export function resolveUserName (user) {
  return `${user.profile.name || user.emails[0].address.split('@')[0]}`
}

function engage (params) {
  // where to: url
  // who: email
  // why: notification id
  const engagementURL = URL.parse(resolveServiceDomain('e'))
  engagementURL.search = url2._encodeParams(params)
  return URL.format(engagementURL)
}

// Does not work on localhost domains, since we assume 4 parts: $service.$stage.unee-t.com
function resolveServiceDomain (service) {
  const url = URL.parse(process.env.ROOT_URL)
  const hparts = url.hostname.split('.')
  hparts[0] = service
  url.host = hparts.join('.')
  return URL.format(url)
}

export function optOutHtml (settingType, notificationId, user, optoutUrl) {
  return (`
<p>
${footer}
</p>
    <p>
      To opt out of receiving "${settingType}" emails, please visit
      <a href='${
    engage({
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
    ${engage({
      url: URL.resolve(process.env.ROOT_URL, '/notification-settings'),
      id: notificationId,
      email: user.emails[0].address
    })}
 `)
}
