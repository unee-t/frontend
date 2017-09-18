import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from '../app.mss'

export default class Task extends Component {
  render () {
    const { task, onRemove, onTogglePrivate, onSetChecked } = this.props

    const taskClassName = classnames({
      [styles.checked]: this.props.task.checked,
      [styles.private]: this.props.task.private,
      [styles.listItem]: true
    })

    return (
      <li className={taskClassName}>
        <button className={styles.delete} onClick={() => onRemove(task._id)}>
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
            <button className={styles.togglePrivate} onClick={() => onTogglePrivate(task._id, !task.private)}>
              { task.private ? 'Private' : 'Public' }
            </button>
          ) : ''}

        <span className={styles.text}>
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
