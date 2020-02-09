import { Meteor } from 'meteor/meteor'

export const attachmentTextMatcher = text => {
  const cloudinaryDownloadUrl = Meteor.settings.public.CLOUDINARY_API_ENDPOINT.replace('/api.', '/res.').replace(/\/v1_1(\/[^/]+\/).*/, '$1')
  const attachmentRegexStr = '^\\[!attachment\\(([a-zA-Z]+)\\)\\]\\n'
  const previewPrefixRegex = new RegExp(attachmentRegexStr + 'data:')
  const blobPrefixRegex = new RegExp(attachmentRegexStr + 'blob:')
  const cloudinaryPrefixRegex = new RegExp(attachmentRegexStr + cloudinaryDownloadUrl)
  const legacyPrefixRegex = new RegExp('^\\[!attachment\\]\\n' + cloudinaryDownloadUrl)
  const match = text.match(previewPrefixRegex) ||
    text.match(cloudinaryPrefixRegex) ||
    text.match(legacyPrefixRegex) ||
    text.match(blobPrefixRegex)
  return match && (match.length > 1 ? match[1] : 'image')
}

export const floorPlanTextMatcher = text => {
  const match = text.match(/^\[!floorPlan\(([a-zA-Z0-9]+)\)]\n(.+)/)
  return match && {
    id: match[1],
    pins: match[2].split(';').map(textPoint => textPoint.split(',').map(str => parseFloat(str)))
  }
}

const isTemporaryEmail = /^temporary\..+@.+\..+\.?.*\.{0,2}.*$/
export const placeholderEmailMatcher = email => isTemporaryEmail.test(email)

const isRoleCanBeOccupant = /(owner|landlord|tenant)/i
export const roleCanBeOccupantMatcher = roleName => isRoleCanBeOccupant.test(roleName)
