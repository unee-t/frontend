import { combineEpics } from 'redux-observable'
import { createAttachment } from './epics/create-attachment'
import { createComment } from './epics/create-comment'
import { retryAttachment } from './epics/retry-attachment'
import { addRoleUser } from './epics/add-role-user'
import { removeRoleUser } from './epics/remove-role-user'
import { inviteNewUser } from './epics/invite-new-user'
import { assignExistingUser } from './epics/assign-existing-user'
import { createCase } from './epics/create-case'
import { fetchInvitationCredentials } from './epics/fetch-invitation-credentials'
import { updateUserName } from './epics/update-invited-user-name'
import { logoutUser } from './epics/logout-user'

export const rootEpic = combineEpics(
  createAttachment,
  retryAttachment,
  createComment,
  addRoleUser,
  removeRoleUser,
  inviteNewUser,
  assignExistingUser,
  createCase,
  fetchInvitationCredentials,
  updateUserName,
  logoutUser
)
