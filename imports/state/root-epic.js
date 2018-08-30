import { combineEpics } from 'redux-observable'
import { createAttachment } from './epics/create-attachment'
import { createComment } from './epics/create-comment'
import { retryAttachment } from './epics/retry-attachment'
import { addRoleUsers } from './epics/add-role-users'
import { removeRoleUser } from './epics/remove-role-user'
import { inviteNewUser } from './epics/invite-new-user'
import { assignExistingUser } from './epics/assign-existing-user'
import { createCase } from './epics/create-case'
import { fetchInvitationCredentials } from './epics/fetch-invitation-credentials'
import { updateUserName } from './epics/update-invited-user-name'
import { logoutUser } from './epics/logout-user'
import { editCaseField } from './epics/edit-case-field'
import { forgotPass } from './epics/forgot-pass'
import { checkPassReset } from './epics/check-pass-reset'
import { resetPass } from './epics/reset-pass'
import { createReport } from './epics/create-report'
import { changeNotificationSetting } from './epics/change-notification-setting'
import { createUnit } from './epics/create-unit'
import { markCaseCommentsAsRead } from './epics/mark-case-notifications-as-read'
import { finalizeReport } from './epics/finalize-report'
import { editReportField } from './epics/edit-report-field'
import { addReportAttachment } from './epics/add-report-attachment'
import { retryReportAttachment } from './epics/retry-report-attachment'
import { generateReportHTMLPreview } from './epics/generate-report-html-preview'

export const rootEpic = combineEpics(
  createAttachment,
  retryAttachment,
  createComment,
  addRoleUsers,
  removeRoleUser,
  inviteNewUser,
  assignExistingUser,
  createCase,
  fetchInvitationCredentials,
  updateUserName,
  logoutUser,
  editCaseField,
  forgotPass,
  checkPassReset,
  resetPass,
  changeNotificationSetting,
  createUnit,
  createReport,
  markCaseCommentsAsRead,
  finalizeReport,
  editReportField,
  addReportAttachment,
  retryReportAttachment,
  generateReportHTMLPreview
)
