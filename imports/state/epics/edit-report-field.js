import debouncedMethodCaller from './base/debounced-method-caller'
import { EDIT_REPORT_FIELD } from '../../ui/report-wizard/report-wizard.actions'
import { collectionName } from '../../api/reports'

export const editReportField = debouncedMethodCaller({
  actionType: EDIT_REPORT_FIELD,
  methodName: `${collectionName}.editReportField`,
  argTranslator: ({ changeSet, reportId }) => [parseInt(reportId), changeSet]
})
