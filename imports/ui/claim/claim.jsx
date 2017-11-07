import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import moment from 'moment'
import { Meteor } from 'meteor/meteor'
import Claims from '../../api/claims'
import AppBar from 'material-ui/AppBar'
import Subheader from 'material-ui/Subheader'
import IconButton from 'material-ui/IconButton'
import SvgIcon from 'material-ui/SvgIcon'
import FontIcon from 'material-ui/FontIcon'

import styles from './claim.mss'
import { logoIconStyle, logoButtonStyle, subheaderStyle, titleStyle, moreVertIconColor } from './claim.mui-styles'

// const dateFormat = 'DD MMM YYYY'
function formatDate (date) {
  return moment(date).format('DD MMM YYYY')
}

const UneeTIcon = (props) => (
  <SvgIcon {...props} viewBox='3 3 39 39'>
    <use xlinkHref='/unee-t_logo_reverse.svg#icon' />
  </SvgIcon>
)

class Claim extends Component {
  render () {
    const { claim } = this.props
    if (!claim) return <h1>Loading...</h1>

    return (
      <div>
        {this.renderTitle(claim)}
        {this.renderStatusLine(claim)}
        {this.renderDependenciesLine(claim)}
        {this.renderBody(claim)}
      </div>
    )
  }

  renderTitle ({ summary, product }) {
    return (
      <div>
        <AppBar title={product}
          titleStyle={titleStyle}
          iconElementLeft={
            <IconButton iconStyle={logoIconStyle} style={logoButtonStyle}>
              <UneeTIcon />
            </IconButton>
          }
        />
        <Subheader style={subheaderStyle} className='flex'>
          <div className='flex-grow ellipsis' title={summary}>{summary}</div>
          <div>
            <IconButton>
              <FontIcon className='material-icons' color={moreVertIconColor}>more_vert</FontIcon>
            </IconButton>
          </div>
        </Subheader>
      </div>
    )
  }

  renderStatusLine ({ status, last_change_time }) {
    return (
      <div className={styles.section}>
        <div>
          <select name='status'>
            <option value={status}>{status}</option>
          </select>
        </div>
        <div className={styles.itemFlow} title={formatDate(last_change_time)}>
          Since {formatDate(last_change_time)}
        </div>
        <div>
          <button>M</button>
        </div>
        <div>
          <button>H</button>
        </div>
      </div>
    )
  }

  renderDependenciesLine ({ depends_on, blocks }) {
    return (
      <div className={styles.section}>
        <div className={[styles.dependenciesDetails, styles.itemFlow].join(' ')}>
          <div className={styles.labels}>
            <div>Depends on:</div>
            <div>Blocks:</div>
          </div>
          <div>
            <div>{depends_on.length ? depends_on.join(', ') : ' -'}</div>
            <div>{blocks.length ? depends_on.join(', ') : ' -'}</div>
          </div>
        </div>
        <div>
          <div>
            <button><i className='icon icon-edit' /></button>
          </div>
          <div>
            <button className={styles.editButton}><i className='icon icon-edit' /></button>
          </div>
        </div>
        <div className={styles.dependencyTreeAccess}>
          <div className={styles.label}>
            Dependency<br />trees
          </div>
          <div>
            <button className={styles.treeViewerButton}><i className='icon icon-tree' /></button>
          </div>
        </div>
      </div>
    )
  }

  renderBody () {
    return (
      <div className={styles.section} />
    )
  }
}

Claim.propTypes = {
  claim: PropTypes.object
}

const ClaimContainer = createContainer(props => {
  const { claimId } = props.match.params
  Meteor.subscribe('claim', claimId)

  return {
    claim: Claims.findOne(claimId)
  }
}, Claim)

function mapStateToProps (state) {
  return {
  }
}

export default connect(mapStateToProps)(ClaimContainer)
