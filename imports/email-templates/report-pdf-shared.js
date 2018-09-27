import { resolveUserName } from './components/helpers'
import url from 'url'

export default (sender, senderRole, recipient, reportId, pdfUrl, reportTitle, unitName) => ({
  subject: `Inspection Report "${reportTitle}" for "${unitName}"`,
  html: `
    <div class='max-width: 600px'>
      <p>Hi ${resolveUserName(recipient)},</p>
      <p>
        <span style='font-weight: bold'>${resolveUserName(sender)} </span>
        (${senderRole}) has shared with you Inspection Report
        <span style='font-weight: bold'> "${reportTitle}" for ${unitName}</span>
      </p>
      <p>
        You may also view the inspection report here:
        ${url.resolve(process.env.ROOT_URL, `/report/${reportId}/preview`)}
      </p>
      <p style='margin-top: 2em; font-weight: 600'>
        Cheers,
        Your friends at Unee-T
      </p>
      <p>
         <img src="cid:logo@unee-t.com" />
         Learn more about how Unee-T can help you supercharge the management of units at <a href="https://unee-t.com">unee-t.com</a>
      </p>    
    </div>
  `,
  text: `
Hi ${resolveUserName(recipient)},

${resolveUserName(sender)} has shared with you Inspection Report "${reportTitle}" for ${unitName}


Cheers,
Your friends at Unee-T

Learn more about how Unee-T can help you supercharge the management of units at https://unee-t.com
`,
  attachments: [
    {
      path: 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png',
      cid: 'logo@unee-t.com'
    },
    {
      path: pdfUrl
    }
  ]
})
