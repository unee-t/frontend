import debouncedMethodCaller from './base/debounced-method-caller'
import { EDIT_CASE_FIELD } from '../../ui/case/case.actions'
import { collectionName } from '../../api/cases'

export const editCaseField = debouncedMethodCaller({
  actionType: EDIT_CASE_FIELD,
  methodName: `${collectionName}.editCaseField`,
  argTranslator: ({ changeSet, caseId }) => [parseInt(caseId), changeSet]
})
