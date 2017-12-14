import { Meteor } from 'meteor/meteor'

export const attachmentTextMatcher = text => {
  const cloudinaryDownloadUrl = Meteor.settings.public.CLOUDINARY_URL.replace('/api.', '/res.').replace('/v1_1', '')
  return text.indexOf(`[!attachment]\n${cloudinaryDownloadUrl}`) === 0
}
