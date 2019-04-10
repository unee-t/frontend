import { Meteor } from 'meteor/meteor'
import bugzillaApi from '../../util/bugzilla-api'
import { logger } from '../../util/logger'

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
const defaultIdResolver = item => item.id.toString()
export default ({ collectionName, dataResolver, idResolver = defaultIdResolver }) => {
  // Storing all handles for use in live updates
  const addedMatcherDescriptors = []
  const changedHandlesMap = {}
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

        // Clearing the subscription handle from the dictionary, and the entire descriptor from the main array
        subHandle.onStop(() => {
          const handleIndex = matchersDict[identifier].handles.indexOf(subHandle)
          matchersDict[identifier].handles.splice(handleIndex, 1)
          if (matchersDict[identifier].handles.length === 0) { // No more handles left for this descriptor
            const descInd = addedMatcherDescriptors.indexOf(matchersDict[identifier])
            addedMatcherDescriptors.splice(descInd, 1)
            delete matchersDict[identifier]
          }
        })
      }
    }
  }
  const defaultIdentityResolver = (handle, query) => JSON.stringify(query)
  const basePublish = (subHandle, url, resolver, payload = {}) => {
    const { callAPI } = bugzillaApi

    // Checking if the user is authenticated
    if (!subHandle.userId) {
      subHandle.error(new Meteor.Error({ message: 'Authentication required' }))
      return false
    }

    // Fetching the current user
    const currUser = Meteor.users.findOne({ _id: subHandle.userId })
    let handleStopped

    // Fetching the data from bugzilla using the uriTemplate given by the resource implementation
    callAPI('get', url, Object.assign({ api_key: currUser.bugzillaCreds.apiKey }, payload))
      .then(data => {
        // Using the dataResolver callback to focus on the relevant data from the response object
        const payload = resolver(data)

        // Checking whether this resource was intended to be a list or a single item, assigning strategy func
        const doPayloadAction = Array.isArray(payload)
          ? (payload, func) => payload.forEach(func)
          : (payload, func) => func(payload)

        // Creating a function that could be used to add every item to the simulated collection
        doPayloadAction(payload, item => {
          const idStr = idResolver(item)
          if (!handleStopped) {
            const resourceHandles = changedHandlesMap[idStr] = changedHandlesMap[idStr] || []
            resourceHandles.push(subHandle)
          }
          subHandle.added(collectionName, idStr, item)
        })

        subHandle.onStop(() => {
          doPayloadAction(payload, item => {
            const idStr = idResolver(item)
            if (changedHandlesMap[idStr]) {
              const handleInd = changedHandlesMap[idStr].indexOf(subHandle)
              changedHandlesMap[idStr].splice(handleInd, 1)
            }
          })
        })

        // Signaling the subscribed client that the data has finished loading
        subHandle.ready()
      })
      .catch(err => {
        logger.info(
          `client request from user ${subHandle.userId} to ${url} with ${JSON.stringify(payload)} resulted
           in an error:`,
          err
        )
        subHandle.error(new Meteor.Error({ message: 'REST API error', origError: err }))
      })
    subHandle.onStop(() => {
      handleStopped = true
    })
    return true
  }
  return {
    publishById ({ uriTemplate, addedMatcherFactory }) {
      const store = matchersStore(addedMatcherFactory)
      return function (resourceId) {
        const resolvedRoute = uriTemplate(resourceId)
        let accepted

        // TODO: Add tests for this enhancement
        if (typeof resolvedRoute === 'string') {
          accepted = basePublish(this, resolvedRoute, data => dataResolver(data, resourceId))
        } else {
          const { url, params } = resolvedRoute
          accepted = basePublish(this, url, data => dataResolver(data, resourceId), params)
        }

        if (accepted) {
          store(this, resourceId.toString())
        }
      }
    },
    // TODO: Add tests for this
    publishByCustomQuery ({ uriTemplate, addedMatcherFactory, queryBuilder, requestIdentityResolver = defaultIdentityResolver }) {
      const store = matchersStore(addedMatcherFactory)
      return function () {
        const query = queryBuilder(this, ...arguments)
        const accepted = basePublish(this, uriTemplate(query), data => dataResolver(data, query), query)

        if (accepted) {
          store(this, requestIdentityResolver(this, query, ...arguments))
        }
      }
    },
    // TODO: Add tests for all the changes observation sequences
    handleAdded (item) {
      addedMatcherDescriptors
        .filter(desc => desc.matcher(item))
        .reduce((flatList, desc) => flatList.concat(desc.handles), [])
        .forEach(handle => handle.added(collectionName, item.id.toString(), item))
    },
    handleChanged (item, fieldNames) {
      const idStr = item.id.toString()

      // Picking just the fields that were announced as changed for better bandwidth usage when calling the handles' "changed" hook
      const fields = Object.keys(item).reduce((all, key) => {
        if (fieldNames.includes(key)) {
          all[key] = item[key]
        }
        return all
      }, {})

      const changedHandles = changedHandlesMap[idStr]
      if (changedHandles) { // unlikely to be false, but I can imagine some edge cases
        changedHandles.forEach(handle => { // Notifying the change to all handles subscribed to this item
          handle.changed(collectionName, idStr, fields)
        })
      }

      // Sorting descriptors to two classes: one that the item can potentially be added to, and the other - removed from
      const descClasses = addedMatcherDescriptors.reduce((all, desc) => {
        if (desc.matcher(item)) {
          all.added.push(desc)
        } else {
          all.removed.push(desc)
        }
        return all
      }, { added: [], removed: [] })

      // For the potentially added - calling "added" for all client handles that weren't notified of the change (they're not subscribed to the item yet)
      descClasses.added
        .reduce((flatList, desc) => flatList.concat(desc.handles), [])
        .forEach(handle => {
          if (!changedHandles.includes(handle)) {
            handle.added(collectionName, idStr, item)
            changedHandles.push(handle)
          }
        })

      // For the potentially removed - calling "removed" for all client handles that were notified of the change (they are subscribed to this item already)
      descClasses.removed
        .reduce((flatList, desc) => flatList.concat(desc.handles), [])
        .forEach(handle => {
          const handleIdx = changedHandles.indexOf(handle)
          if (handleIdx !== -1) {
            handle.removed(collectionName, idStr)
            changedHandles.splice(handleIdx, 1)
          }
        })
    },
    handleRemoved (resourceId, itemId) {
      // TODO: complete implementation
    }
  }
}
