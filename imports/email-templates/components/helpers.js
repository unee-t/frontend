import URL from 'url'
import { URL as url2 } from 'meteor/url'
import { Meteor } from 'meteor/meteor'
import randToken from 'rand-token'
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

export function getCaseAccessPath (recipient, caseId, unitId) {
  if (recipient.profile.isLimited) {
    // Finding a matching direct invitation to case
    const relevantCaseInvite = recipient.receivedInvites.find(inv => inv.caseId === caseId)
    let relevantUnitInvite, accessToken

    // Trying to find a matching unit invitation, if a case invitation hasn't been found
    if (!relevantCaseInvite) {
      relevantUnitInvite = recipient.receivedInvites.find(inv => inv.unitId === unitId)

      // If no matching unit invitation was found, something is seriously wrong and we can't notify the user
      if (!relevantUnitInvite) throw new Meteor.Error(`No invite found for user to notify ${recipient._id} for case ${caseId}`)

      // Trying to find a case access token in the unit invitation's sub collection
      const relevantCaseToken = relevantUnitInvite.casesTokens && relevantUnitInvite.casesTokens.find(tok => tok.caseId === caseId)
      if (!relevantCaseToken) {
        // Creating a new sub case token if none exists yet
        accessToken = randToken.generate(24)
        Meteor.users.update({
          _id: recipient._id,
          'receivedInvites.unitId': unitId
        }, {
          $push: {
            'receivedInvites.$.casesTokens': {
              caseId,
              accessToken
            }
          }
        })
      } else {
        // Using the existing sub case token for access
        accessToken = relevantCaseToken.accessToken
      }
    } else {
      // Using the existing main case invitation's token for access
      accessToken = relevantCaseInvite.accessToken
    }

    return `/invitation?code=${accessToken}`
  } else {
    return `/case/${caseId}`
  }
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
