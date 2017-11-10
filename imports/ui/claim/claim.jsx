import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import moment from 'moment'
import { Meteor } from 'meteor/meteor'
import Claims from '../../api/claims'

import styles from './claim.mss'

// const dateFormat = 'DD MMM YYYY'
function formatDate (date) {
  return moment(date).format('DD MMM YYYY')
}

class Claim extends Component {
  render () {
    const { claim } = this.props
    if (!claim) return <h1>Loading...</h1>

    return (
      <div className={styles.container}>
        {this.renderTitle(claim)}
        {this.renderStatusLine(claim)}
        {this.renderDependenciesLine(claim)}
        {this.renderBody(claim)}
      </div>
    )
  }

  renderTitle ({ id, summary, creation_time }) {
    return (
      <div className={styles.section}>
        <div>{id}</div>
        <div className={styles.itemFlow} title={summary}>{summary}</div>
        <div>
          <button className={styles.editButton}><i className='icon icon-edit' /></button>
        </div>
        <div>{formatDate(creation_time)}</div>
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
      <div className={styles.section}>
        <h1>asdasdsad</h1>
      </div>
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
