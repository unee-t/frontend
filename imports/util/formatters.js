import moment from 'moment'

export const formatDayText = time => {
  const generalFormat = 'MMMM DD'
  const standardFormat = 'YYYY-MM-DD'
  return moment(time).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: generalFormat,
    sameElse: function (now) {
      return (this.diff(now, 'years') > -1) ? generalFormat : standardFormat
    }
  })
}

export const formatThumbUrl = (url, pixelWidth) => url.replace(/\/upload\/[^/]*\//, `/upload/w_${pixelWidth}/`)
