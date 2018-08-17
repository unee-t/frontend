import { ADD_ATTACHMENT } from '../../ui/report-wizard/report-wizard.actions'
import { createAttachment } from '../../ui/case/case.actions'

import 'rxjs/add/operator/map'

export const addReportAttachment = action$ => action$
  .ofType(ADD_ATTACHMENT)
  .map(({ preview, file, reportId }) => createAttachment(preview, file, reportId))
