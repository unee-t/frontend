import React from 'react'
import CircularProgress from 'material-ui/CircularProgress'

export default class Preloader extends React.Component {
  render () {
    return (
      <div className='dt w-100 full-height'>
        <div className='dtc v-mid tc'>
          <CircularProgress size={80} thickness={5} />
        </div>
      </div>
    )
  }
}
