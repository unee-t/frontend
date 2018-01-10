import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import Cases from '../../api/cases'

class CaseExplorer extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      caseId: ''
    }
  }
  handleCaseIdChange (evt) {
    this.setState({
      caseId: evt.target.value
    })
  }
  render () {
    const { caseList, casesError, isLoading } = this.props
    return (
      <div className='w-100 tc'>
        <h3>Choose the case that you wish to view</h3>
        <input type='text' className='mv4' placeholder='Case id number' onChange={this.handleCaseIdChange.bind(this)} value={this.state.caseId} />
        {this.state.caseId ? (
          <Link className='f6 link dim black db' to={`/case/${this.state.caseId}`}>Go to case</Link>
        ) : ''}
        <div>
          {isLoading ? (
            <span>Loading your cases...</span>
          ) : casesError ? (
            <span>Cases failed to load due to {casesError.error.message}</span>
          ) : caseList.map(caseItem => (
            <Link className='f6 link dim bondi-blue db' to={`/case/${caseItem.id}`} key={caseItem.id}>
              #{caseItem.id} {caseItem.summary}
            </Link>
          ))}
        </div>
      </div>
    )
  }
}

CaseExplorer.propTypes = {
  caseList: PropTypes.array,
  isLoading: PropTypes.bool,
  casesError: PropTypes.object
}
let casesError
export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => { // map meteor state to props
  const casesHandle = Meteor.subscribe('myCases', {
    onStop: (error) => {
      casesError = error
    }
  })
  return {
    caseList: Cases.find().fetch(),
    isLoading: !casesHandle.ready(),
    casesError
  }
}, CaseExplorer))
