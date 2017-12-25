import { Meteor } from 'meteor/meteor'

export const attachmentTextMatcher = text => {
  const cloudinaryDownloadUrl = Meteor.settings.public.CLOUDINARY_URL.replace('/api.', '/res.').replace('/v1_1', '')
  const previewPrefix = 'data:image/'
  const prefix = '[!attachment]\n'
  return text.indexOf(prefix + cloudinaryDownloadUrl) === 0 || text.indexOf(prefix + previewPrefix) === 0
}
