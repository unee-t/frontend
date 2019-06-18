import genericEmailLayout from './generic-email-layout'

export default ({ typeTitle, user, mainContentHtml, mainContentText, accessUrl, optOutUrl, reasonExplanation, unitCreator }) => {
  const customConfig = unitCreator && unitCreator.customEmailBrandingConfig

  return genericEmailLayout({
    mainContentHtml: `
      ${mainContentHtml}
      <p>
        Click on this <a href="${accessUrl}">link</a> to see the current status for this case.<br />
        Participate in the conversation, add comments or pictures directly so we can resolve this faster.
      </p>
    `,
    mainContentText: `
${mainContentText}

Follow this link: "${accessUrl}" to see the current status for this case.
Participate in the conversation, add comments or pictures directly so we can resolve this faster.
    `,
    unsubClauseHtml: `
      <div class="unsub-instruction">
        <a href="${optOutUrl}">Unsubscribe</a> from these type of emails. <a href="${optOutUrl}">Manage your settings</a> for all type of email updates
      </div>
    `,
    unsubClauseText: `
To Unsubscribe from these type of emails or manage your settings for all type of email updates, go to ${optOutUrl}
    `,
    brandConfig: customConfig,
    title: `${typeTitle}- Notification Email`,
    reasonExplanation,
    typeTitle,
    user
  })
}
