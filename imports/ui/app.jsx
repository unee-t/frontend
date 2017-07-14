import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import { createContainer } from 'meteor/react-meteor-data'
import { Meteor } from 'meteor/meteor'
import { Tasks } from '../api/tasks'
import actions from './task/task.actions'
import { connect } from 'react-redux'

import Task from './task/task.jsx'
import AccountsUIWrapper from './accounts-ui-wrapper.jsx'

// App component - represents the whole app
class App extends Component {
  renderTasks () {
    let filteredTasks = this.props.tasks
    const { dispatch } = this.props
    if (this.props.hideCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.checked)
    }
    return filteredTasks.map((task) => {
      const currentUserId = this.props.currentUser && this.props.currentUser._id
      const showPrivateButton = task.owner === currentUserId

      return (
        <Task
          key={task._id}
          onRemove={id => dispatch(actions.remove(id))}
          onSetChecked={(id, isChecked) => dispatch(actions.setChecked(id, isChecked))}
          onTogglePrivate={(id, isPrivate) => dispatch(actions.togglePrivate(id, isPrivate))}
          showPrivateButton={showPrivateButton}
          task={task}
        />
      )
    })
  }

  handleSubmit (event) {
    event.preventDefault()

    // Find the text field via the React ref
    const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim()

    Meteor.call('tasks.insert', text)

    // Clear form
    ReactDOM.findDOMNode(this.refs.textInput).value = ''
  }

  render () {
    const { dispatch } = this.props
    return (
      <div className='container'>
        <header>
          <h1>Todo List</h1>

          <label className='hide-completed'>
            <input
              type='checkbox'
              readOnly
              checked={this.props.hideCompleted}
              onClick={() => dispatch(actions.toggleHideCompleted(!this.props.hideCompleted))}
            />
            Hide Completed Tasks
          </label>

          <AccountsUIWrapper />

          { this.props.currentUser
            ? <form className='new-task' onSubmit={this.handleSubmit.bind(this)} >
              <input
                type='text'
                ref='textInput'
                placeholder='Type to add new tasks'
              />
            </form> : ''
          }
        </header>

        <ul>
          {this.renderTasks()}
        </ul>
      </div>
    )
  }
}

App.propTypes = {
  tasks: PropTypes.array.isRequired,
  incompleteCount: PropTypes.number.isRequired,
  currentUser: PropTypes.object,
  hideCompleted: React.PropTypes.bool.isRequired
}

const AppContainer = createContainer(() => {
  Meteor.subscribe('tasks')

  return {
    tasks: Tasks.find({}, { sort: { createdAt: -1 } }).fetch(),
    incompleteCount: Tasks.find({ checked: { $ne: true } }).count(),
    currentUser: Meteor.user()
  }
}, App)

function mapStateToProps (state) {
  return {
    hideCompleted: state.hideCompleted
  }
}

export default connect(mapStateToProps)(AppContainer)
