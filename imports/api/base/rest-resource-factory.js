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
export default ({collectionName, dataResolver}) => {
  // Storing all handles for use in live updates
  const addedMatcherDescriptors = []
  const changedHandles = {}
  const matchersStore = addedMatcherFactory => {
    let matchersDict
    if (addedMatcherFactory) matchersDict = {}
    return (subHandle, identifier) => {
      if (matchersDict) {
        // Adding the current handle to a descriptor with a suitable matcher function
        if (matchersDict[identifier]) {
          matchersDict[identifier].handles.push(subHandle)
        } else {
          matchersDict[identifier] = {
            matcher: addedMatcherFactory(identifier),
            handles: [subHandle]
          }
          addedMatcherDescriptors.push(matchersDict[identifier])
        }
      }
    }
  }
  const basePublish = (subHandle, url, resolver, payload = {}) => {
    const {callAPI} = bugzillaApi

    // Checking if the user is authenticated
    if (!subHandle.userId) {
      subHandle.ready()
      subHandle.error(new Meteor.Error({message: 'Authentication required'}))
      return false
    }

    // Fetching the current user
    const currUser = Meteor.users.findOne({_id: subHandle.userId})

    // Fetching the data from bugzilla using the uriTemplate given by the resource implementation
    callAPI('get', url, Object.assign({token: currUser.bugzillaCreds.token}, payload))
      .then(data => {
        // Using the dataResolver callback to focus on the relevant data from the response object
        const payload = resolver(data)

        // Creating a function that could be used to add every item to the simulated collection
        const collectionAdd = item => {
          const idStr = item.id.toString()
          const resourceHandles = changedHandles[idStr] = changedHandles[idStr] || []
          resourceHandles.push(subHandle)
          subHandle.added(collectionName, idStr, item)
        }

        // Checking whether this resource was intended to be a list or a single item
        if (Array.isArray(payload)) {
          payload.forEach(collectionAdd)
        } else {
          collectionAdd(payload)
        }

        // Signaling the subscribed client that the data has finished loading
        subHandle.ready()
      })
      .catch(err => {
        subHandle.ready()
        subHandle.error(new Meteor.Error({message: 'REST API error', origError: err}))
      })
    // TODO: IMPORTANT! handle sub.onStop and remove from the stores
    return true
  }
  return {
    publishById ({uriTemplate, addedMatcherFactory}) {
      const store = matchersStore(addedMatcherFactory)
      return function (resourceId) {
        const accepted = basePublish(this, uriTemplate(resourceId), data => dataResolver(data, resourceId))

        if (accepted) {
          store(this, resourceId.toString())
        }
      }
    },
    // TODO: Add tests for this
    publishByCustomQuery ({uriTemplate, addedMatcherFactory, queryBuilder}) {
      const store = matchersStore(addedMatcherFactory)
      return function () {
        const query = queryBuilder(this, ...arguments)
        const accepted = basePublish(this, uriTemplate(query), data => dataResolver(data, query), query)

        if (accepted) {
          store(this, JSON.stringify(query))
        }
      }
    },
    handleAdded (item) {
      addedMatcherDescriptors
        .filter(desc => desc.matcher(item))
        .reduce((flatList, desc) => flatList.concat(desc.handles), [])
        .forEach(handle => handle.added(collectionName, item.id.toString(), item))
    },
    handleChanged (resourceId, item) {
      // TODO: complete implementation
    },
    handleRemoved (resourceId, itemId) {
      // TODO: complete implementation
    }
  }
}
