import React, { Component } from 'react'
import { Meteor } from 'meteor/meteor'
import { connect } from 'react-redux'
import { createContainer } from 'meteor/react-meteor-data'
import PropTypes from 'prop-types'
import styles from './upload.mss'

// Based upon http://jsfiddle.net/roee_ba/nqfrpszz/

// TODO disable ability to navigate away during an upload
// https://www.w3schools.com/jsref/event_onbeforeunload.asp
// https://www.npmjs.com/package/react-beforeunload

class UploadPage extends Component {
  AJAXSubmit () {
    const formElement = this.refs.form
    console.log('starting AJAXSubmit')

    if (!formElement.action) { return }
    const xhr = new window.XMLHttpRequest()
    xhr.upload.addEventListener('progress', (event) => {
      console.log(event)
      if (event.lengthComputable) {
        document.getElementById('progress-bar').style.width = event.loaded / event.total * 100 + '%'
        document.getElementById('progress-bar').innerHTML = event.loaded / event.total * 100 + '%'
      }
    }, false)
    xhr.onload = this.ajaxSuccess
    xhr.open('post', formElement.action)

    const fd = new window.FormData(formElement)
    fd.append('folder', this.props.user._id)

    Meteor.call('sign', (err, result) => {
      if (err) { console.log(err) }

      // console.log("Sign key", result)

      fd.append('upload_preset', result)
      xhr.send(fd)
    })
  }

  ajaxSuccess () {
    const response = JSON.parse(this.responseText)
    console.log('ajaxSuccess', typeof this.responseText, response)
    // TODO: Return thumb version of image
    document.getElementById('uploaded').setAttribute('src', response['secure_url'])
  }

  render () {
    return (
      <div>
        <img id='uploaded' />
        <form ref='form' action='https://api.cloudinary.com/v1_1/unee-t/image/upload'
          method='post'
          encType='multipart/form-data'>
          <div id='progress-bar' className={styles['progress-bar']} />
          <input onChange={this.AJAXSubmit.bind(this)} type='file' name='file' />
        </form>
      </div>
    )
  }
}

UploadPage.propTypes = {
  user: PropTypes.object
}

export default connect(
  () => ({}) // map redux state to props
)(createContainer(() => ({ user: Meteor.user() }), UploadPage)) // map meteor state to props
