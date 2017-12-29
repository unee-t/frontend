const generalReplacer = (url, paramsStr) => url.replace(/\/upload\/[^/]*\//, `/upload/${paramsStr}/`)

export const matchWidth = (url, pixelWidth) => generalReplacer(url, `w_${pixelWidth}`)
export const fitDimensions = (url, pixelWidth, pixelHeight) =>
  generalReplacer(url, `w_${pixelWidth},h_${pixelHeight},c_fill`)
