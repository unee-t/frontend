export function togglePrivate(id, isPrivate) {
	return () => {
		Meteor.call('tasks.setPrivate', id, isPrivate)
	}
}

export function remove(id) {
	return () => {
		Meteor.call('tasks.remove', id)
	}
}

export function setChecked(id, isChecked) {
	return () => {
		Meteor.call('tasks.setChecked', id, isChecked)
	}
}

export function toggleHideCompleted(hideCompleted) {
	return {
		type: 'TOGGLE_HIDE_COMPLETED',
		value: hideCompleted,
	}
}


