import { Migrations } from 'meteor/percolate:migrations'
import ReportSnapshots from '../api/report-snapshots'
import { generatePreviewUrl, generatePDFFromPreview, fetchReportUnitInfo } from '../api/reports'

Migrations.add({
  version: 10,
  up: () => {
    ReportSnapshots.find().forEach(snap => {
      const reportUnitInfo = fetchReportUnitInfo(snap.reportItem.product)
      const previewUrl = generatePreviewUrl({
        reportBlob: snap.reportItem,
        signatureMap: snap.signatureMap || {},
        errorLogParams: {
          initiator: 'Migration #10'
        },
        ...reportUnitInfo
      })
      const pdfUrl = generatePDFFromPreview(previewUrl)
      console.log('update', snap.reportItem.id, previewUrl, pdfUrl)

      ReportSnapshots.update({
        _id: snap._id
      }, {
        $set: {
          previewUrl,
          pdfUrl,
          ...reportUnitInfo
        },
        $unset: {
          signatureMap: 1
        }
      })
    })
  },
  down: () => {
    ReportSnapshots.update({}, {
      $unset: {
        unitMetaData: 1,
        unitRoles: 1,
        previewUrl: 1,
        pdfUrl: 1
      }
    })
  }
})
