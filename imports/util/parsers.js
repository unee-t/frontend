export const parseQueryString = queryString => {
  const valuesString = queryString.indexOf('?') === 0 ? queryString.slice(1) : queryString
  return valuesString.split('&').reduce((all, pairStr) => {
    const pair = pairStr.split('=')
    all[pair[0]] = pair[1]
    return all
  }, {})
}
