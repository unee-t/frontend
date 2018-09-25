import { HTTP } from 'meteor/http'
import ReportSnapshots from '../report-snapshots'
export default function (req, res) {
  if (!req.query.reportPdfUrl) {
    return res.send(400, '"reportPdfUrl" query param is missing')
  }
  const pdfUrl = decodeURIComponent(req.query.reportPdfUrl)
  const snap = ReportSnapshots.findOne({pdfUrl}, {_id: 1})
  if (!snap) {
    return res.send(400, 'no matching snapshot for the provided pdf url')
  }
  const file = HTTP.get(pdfUrl, {
    npmRequestOptions: {
      encoding: null
    }
  })
  res.end(file.content)
}
