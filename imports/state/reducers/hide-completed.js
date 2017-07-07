export default function hideCompleted(state = false, action) {
	switch (action.type) {
		case 'TOGGLE_HIDE_COMPLETED':
			return action.value
		default:
			return state
	}
}