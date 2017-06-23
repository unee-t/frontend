import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createContainer } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Tasks } from '../api/tasks.js';

import Task from './task.jsx';
import AccountsUIWrapper from './accounts-ui-wrapper.jsx';

// App component - represents the whole app
class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			hideCompleted: false,
		};
	}

	toggleHideCompleted() {
		this.setState({
			hideCompleted: !this.state.hideCompleted,
		});
	}

	renderTasks() {
		let filteredTasks = this.props.tasks;
		if (this.state.hideCompleted) {
			filteredTasks = filteredTasks.filter(task => !task.checked);
		}
		return filteredTasks.map((task) => {
			const currentUserId = this.props.currentUser && this.props.currentUser._id;
			const showPrivateButton = task.owner === currentUserId;

			return (
				<Task
					key={task._id}
					task={task}
					showPrivateButton={showPrivateButton}
				/>
			);
		});
	}

	handleSubmit(event) {
		event.preventDefault();

		// Find the text field via the React ref
		const text = ReactDOM.findDOMNode(this.refs.textInput).value.trim();

		Meteor.call('tasks.insert', text);

		// Clear form
		ReactDOM.findDOMNode(this.refs.textInput).value = '';
	}

	render() {
		return (
			<div className="container">
				<header>
					<h1>Todo List</h1>

					<label className="hide-completed">
						<input
							type="checkbox"
							readOnly
							checked={this.state.hideCompleted}
							onClick={this.toggleHideCompleted.bind(this)}
						/>
						Hide Completed Tasks
					</label>

					<AccountsUIWrapper />

					{ this.props.currentUser ?
						<form className="new-task" onSubmit={this.handleSubmit.bind(this)} >
							<input
								type="text"
								ref="textInput"
								placeholder="Type to add new tasks"
							/>
						</form> : ''
					}
				</header>

				<ul>
					{this.renderTasks()}
				</ul>
			</div>
		);
	}
}

App.propTypes = {
	tasks: PropTypes.array.isRequired,
	incompleteCount: PropTypes.number.isRequired,
	currentUser: PropTypes.object,
	showPrivateButton: React.PropTypes.bool.isRequired,
};

export default createContainer(() => {
	Meteor.subscribe('tasks');

	return {
		tasks: Tasks.find({},  { sort: { createdAt: -1 } }).fetch(),
		incompleteCount: Tasks.find({ checked: { $ne: true } }).count(),
		currentUser: Meteor.user(),
	};
}, App);