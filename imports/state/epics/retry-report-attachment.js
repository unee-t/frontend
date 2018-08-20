import { RETRY_ATTACHMENT } from '../../ui/report-wizard/report-wizard.actions'
import { retryAttachment } from '../../ui/case/case.actions'

import 'rxjs/add/operator/map'

export const retryReportAttachment = action$ => action$
  .ofType(RETRY_ATTACHMENT)
  .map(({ type, ...process }) => retryAttachment(process))
