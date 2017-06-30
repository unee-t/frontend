import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';
// import { Tasks } from '../../api/tasks.js';
// import { Meteor } from 'meteor/meteor';
// import { remove, togglePrivate, setChecked } from './task.actions';

// Task component - represents a single todo item
export default class Task extends Component {
	// toggleChecked() {
	//
	// 	// Set the checked property to the opposite of its current value
	// 	// Meteor API
	// 	// Tasks.update(this.props.task._id, {
	// 	// 	$set: { checked: !this.props.task.checked },
	// 	// });
	// 	Meteor.call('tasks.setChecked', this.props.task._id, !this.props.task.checked);
	// }

	// deleteThisTask() {
	// 	// Meteor API
	// 	// Tasks.remove(this.props.task._id);
	// 	Meteor.call('tasks.remove', this.props.task._id);
	// }

	// togglePrivate() {
	// 	Meteor.call('tasks.setPrivate', this.props.task._id, ! this.props.task.private);
	// }

	render() {
		const { task, onRemove, onTogglePrivate, onSetChecked} = this.props;

		const taskClassName = classnames({
			checked: this.props.task.checked,
			private: this.props.task.private,
		});

		return (
			<li className={taskClassName}>
				<button className="delete" onClick={() => onRemove(task._id)}>
					&times;
				</button>

				<input
					type="checkbox"
					readOnly
					checked={task.checked}
					onClick={() => onSetChecked(task._id, ! task.checked)}
				/>

				{ this.props.showPrivateButton ? (
						<button className="toggle-private" onClick={() => onTogglePrivate(task._id, ! task.private)}>
							{ task.private ? 'Private' : 'Public' }
						</button>
					) : ''}

				<span className="text">
          <strong>{task.username}</strong>: {task.text}
        </span>
			</li>
		);
	}
}

Task.propTypes = {
	// This component gets the task to display through a React prop.
	// We can use propTypes to indicate it is required
	task: PropTypes.object.isRequired,
	onRemove: PropTypes.func.isRequired,
	onTogglePrivate: PropTypes.func.isRequired,
	onSetChecked: PropTypes.func.isRequired
};