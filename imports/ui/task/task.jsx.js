import React, { Component, PropTypes } from 'react'
import classnames from 'classnames'

export default class Task extends Component {
  render () {
    const { task, onRemove, onTogglePrivate, onSetChecked } = this.props

    const taskClassName = classnames({
      checked: this.props.task.checked,
      private: this.props.task.private
    })

    return (
      <li className={taskClassName}>
        <button className='delete' onClick={() => onRemove(task._id)}>
          &times;
        </button>

        <input
          type='checkbox'
          readOnly
          checked={task.checked}
          onClick={() => onSetChecked(task._id, !task.checked)}
        />

        { this.props.showPrivateButton
          ? (
            <button className='toggle-private' onClick={() => onTogglePrivate(task._id, !task.private)}>
              { task.private ? 'Private' : 'Public' }
            </button>
          ) : ''}

        <span className='text'>
          <strong>{task.username}</strong>: {task.text}
        </span>
      </li>
    )
  }
}

Task.propTypes = {
  // This component gets the task to display through a React prop.
  // We can use propTypes to indicate it is required
  task: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  onTogglePrivate: PropTypes.func.isRequired,
  onSetChecked: PropTypes.func.isRequired,
  showPrivateButton: PropTypes.bool
}
