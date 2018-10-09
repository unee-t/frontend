import { go } from 'react-router-redux'
import { collectionName } from '../../api/reports'
import { FINALIZE_REPORT } from '../../ui/report-wizard/report-wizard.actions'

import fallibleMethodCaller from './base/fallible-method-caller'
import { genericErrorOccurred } from '../../ui/general-actions'

export const finalizeReport = fallibleMethodCaller({
  actionType: FINALIZE_REPORT,
  methodName: `${collectionName}.finalize`,
  argTranslator: ({ reportId, signatureMap }) => [parseInt(reportId), signatureMap],
  actionGenerators: {
    initGen: () => go(-2),
    errorGen: (err, { reportId }) => genericErrorOccurred(
      `Failed to finalize report ${reportId} due to: "${err.error}"`
    )
  }
})
