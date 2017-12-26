import moment from 'moment'

export const formatDayText = time => {
  const generalFormat = 'MMMM DD'
  return moment(time).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: generalFormat,
    sameElse: function (now) {
      return (this.diff(now, 'years') > -1) ? generalFormat : generalFormat + ', YYYY'
    }
  })
}
