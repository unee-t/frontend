import emailResponsiveStyleTag from './email-responsive-style-tag'
import { resolveUserName } from './helpers'

const defaultLogoUrl = 'https://s3-ap-southeast-1.amazonaws.com/prod-media-unee-t/2018-06-14/unee-t_logo_email.png'
const defBrandConfig = {
  logoUrl: null,
  brandName: null,
  signatureHtml: null,
  signatureText: null
}
const uneetTagLine = 'THE Web App to Manage Incidents in your Properties'

const defaultSignatureHtml = `
    <p>
      Regards,<br />
      Unee-T<br />
      ${uneetTagLine}
    </p>
  `
const defaultSignatureText = `
  Regards,
  Unee-T
  ${uneetTagLine}
`

export const getHtml = ({ title, brandConfig, mainContentHtml, reasonExplanation, unsubClauseHtml = '', user }) => `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
    ${emailResponsiveStyleTag}
  </head>
  <body class="">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
      <tr>
        <td>&nbsp;</td>
        <td class="container">
          <div class="content">
    
            <!-- START CENTERED WHITE CONTAINER -->
            <table role="presentation" class="main">
    
              <!-- START MAIN CONTENT AREA -->
              <tr>
                <td class="wrapper">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div class="align-right">
                          <img class="logo" src="${brandConfig.logoUrl || defaultLogoUrl}"/>
                        </div>
                        <p>Hi ${resolveUserName(user)}</p>
                        ${mainContentHtml}
                        ${brandConfig.signatureHtml || defaultSignatureHtml}
                        <hr />
                        <div class="bottom-explanation">
                          You are receiving this email because ${reasonExplanation}.
                        </div>
                        ${unsubClauseHtml}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
    
              <!-- END MAIN CONTENT AREA -->
            </table>
            <!-- END CENTERED WHITE CONTAINER -->
    
            <!-- START FOOTER -->
            <div class="footer">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="content-block powered-by">
                    <div>Powered by <a href="https://unee-t.com"><img src="${defaultLogoUrl}"/></a>.</div>
                    ${brandConfig.signatureHtml ? `<div>Unee-T: ${uneetTagLine}</div>` : ''}
                  </td>
                </tr>
              </table>
            </div>
            <!-- END FOOTER -->
    
          </div>
        </td>
        <td>&nbsp;</td>
      </tr>
    </table>
  </body>
</html>
`

export const getText = ({ mainContentText, reasonExplanation, unsubClauseText = '', brandConfig, user }) => `
Hi ${resolveUserName(user)},

${mainContentText}

${brandConfig.signatureText || defaultSignatureText}
--
You are receiving this email because ${reasonExplanation}.
${unsubClauseText}
${brandConfig.signatureText ? `
Unee-t: ${uneetTagLine}
` : ''}
`

export default ({ typeTitle, user, mainContentHtml, mainContentText, reasonExplanation, brandConfig = defBrandConfig, unsubClauseHtml, unsubClauseText }) => {
  return {
    html: getHtml({
      typeTitle,
      brandConfig,
      mainContentHtml,
      unsubClauseHtml,
      reasonExplanation,
      user
    }),
    text: getText({
      user,
      mainContentText,
      brandConfig,
      unsubClauseText,
      reasonExplanation
    })
  }
}
