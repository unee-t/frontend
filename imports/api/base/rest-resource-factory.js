import { Meteor } from 'meteor/meteor'
import bugzillaApi from '../../util/bugzilla-api'

/**
 This publication generator is using the low-level meteor API to manage a published collection to the client
 It has five available methods on 'this':
 - added(collection-name, id, attributes) - adds a new document
 - changed(collection-name, id, attributes) - changes an existing document and modifies the attributes
 - removed(collection-name, id) - removed an existing document by id
 - ready() - notifies the subscribed client of the initial success of the subscription with the initial data
 - error() - notifies the subscribed client that an error has occurred during the process of this publication
 - onStop(callback) - adds a handler for when a subscribed client removes its subscription
 */
export default (options, isMulti) => {
  // Storing all handles for use in live updates
  const handles = {}
  return {
    publishFunc (resourceId) {
      const {callAPI} = bugzillaApi
      const {uriTemplate, collectionName, dataResolver} = options

      // Checking if the user is authenticated
      if (!this.userId) {
        this.ready()
        this.error(new Meteor.Error({message: 'Authentication required'}))
        return
      }

      // Adding the current handle to the handles of this publication type
      const resourceHandles = handles[resourceId.toString()] = handles[resourceId.toString()] || []
      resourceHandles.push(this)

      // Fetching the current user
      const currUser = Meteor.users.findOne({_id: this.userId})

      // Fetching the data from bugzilla using the uriTemplate given by the using resource implementation
      callAPI('get', uriTemplate(resourceId), {token: currUser.bugzillaCreds.token})
        .then(data => {
          // Using the dataResolver callback to focus on the relevant data from the response object
          const payload = dataResolver(data, resourceId)

          // Creating a function that could be used to add every item to the simulated collection
          const collectionAdd = (item) => this.added(collectionName, item.id.toString(), item)

          // Checking whether this resource was intended to be a list or a single item
          if (isMulti) {
            payload.forEach(collectionAdd)
          } else {
            collectionAdd(payload)
          }

          // Signaling the subscribed client that the data has finished loading
          this.ready()
        })
        .catch(err => {
          this.ready()
          this.error(new Meteor.Error({message: 'REST API error', origError: err}))
        })
    },
    handleAdded (resourceId, item) {
      handles[resourceId.toString()].forEach(handle => handle.added(options.collectionName, item.id.toString(), item))
    },
    handleChanged (resourceId, item) {
      // TODO: complete implementation
    },
    handleRemoved (resourceId, itemId) {
      // TODO: complete implementation
    }
  }
}
