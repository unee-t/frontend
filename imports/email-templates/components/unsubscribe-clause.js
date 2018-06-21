import url from 'url'

export default {
  html: `
    <p>
      To unsubscribe from this type of emails, please visit your notification settings panel at
      <a href='${url.resolve(process.env.ROOT_URL, `/notification-settings`)}'>
        ${url.resolve(process.env.ROOT_URL, `/notification-settings`)}
      </a>
    </p>
  `,
  text: `
    To unsubscribe from this type of emails, please visit your notification settings panel at 
    ${url.resolve(process.env.ROOT_URL, `/notification-settings`)}
  `
}
