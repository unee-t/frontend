import React, { Component } from 'react'
import { Link } from 'react-router-dom'

export default class CaseExplorer extends Component {
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
    return (
      <div className='w-100 tc'>
        <h3>Choose the case that you wish to view</h3>
        <input type='text' className='mv4' placeholder='Case id number' onChange={this.handleCaseIdChange.bind(this)} value={this.state.caseId} />
        {this.state.caseId ? (
          <Link className='f6 link dim black db' to={`/case/${this.state.caseId}`}>Go to case</Link>
        ) : ''}
      </div>
    )
  }
}
