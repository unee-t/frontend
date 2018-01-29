export const emailValidator = emailStr => {
  return !!emailStr && typeof emailStr === 'string' && emailStr.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i)
}
