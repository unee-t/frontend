import { Meteor } from 'meteor/meteor'

export const attachmentTextMatcher = text => {
  const cloudinaryDownloadUrl = Meteor.settings.public.CLOUDINARY_URL.replace('/api.', '/res.').replace('/v1_1', '')
  const previewPrefix = 'data:image/'
  const urlRegex = /^\[!attachment\]\s+(.+)$/m
  const match = text.match(urlRegex)
  return !!match && (match[1].indexOf(cloudinaryDownloadUrl) === 0 || match[1].indexOf(previewPrefix) === 0)
}

const isTemporaryEmail = /^temporary\..+@.+\..+\.?.*\.{0,2}.*$/
export const placeholderEmailMatcher = email => isTemporaryEmail.test(email)

const isRoleCanBeOccupant = /(owner|landlord|tenant)/i
export const roleCanBeOccupantMatcher = roleName => isRoleCanBeOccupant.test(roleName)
