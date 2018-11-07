import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TextField from 'material-ui/TextField'
import Chip from 'material-ui/Chip'

class TagInput extends Component {
  constructor () {
    super(...arguments)
    this.state = {
      currInput: '',
      error: null
    }
  }
  convertValueToTags = value => {
    const { tags, onTagsChanged, validator, onErrorStateChanged } = this.props
    if (!value) return
    const candidates = value.split(/[\s,]+/)
    const faultyCandidate = validator && candidates.find(can => validator(can))
    const newError = faultyCandidate && validator(faultyCandidate)
    if (newError) {
      onErrorStateChanged && onErrorStateChanged(true)
      this.setState({ error: newError })
    } else {
      onTagsChanged(tags.concat(candidates))
      this.setState({
        currInput: '',
        error: null
      })
    }
  }
  handleKeyDown = evt => {
    const { tags, onTagsChanged } = this.props
    const { currInput } = this.state
    const keyName = evt.nativeEvent.code
    if (keyName === 'Backspace' && currInput === '') {
      onTagsChanged(tags.slice(0, -1))
    }
  }
  handleInputChanged = (evt, value) => {
    const { onErrorStateChanged } = this.props
    const { currInput, error } = this.state
    let doSetValue = false
    if (value.length > currInput.length) {
      if (value.length - currInput.length > 1) { // value pasted into the field
        this.setState({ currInput: value }) // Setting the new value first in case there'll be an error to correct
        this.convertValueToTags(value)
      } else {
        // Finding the new char's index in the string
        const valueChars = value.split('')
        const diffIdx = valueChars.findIndex((char, idx) => char !== currInput.charAt(idx))

        // Checking if the new char is a delimiter
        if (valueChars[diffIdx].match(/[\s,]/)) {
          // Using either the new value, if the new char is in the middle, or the old value if the new char is last
          this.convertValueToTags(diffIdx === valueChars.length - 1 ? currInput : value)
        } else {
          doSetValue = true
        }
      }
    } else {
      doSetValue = true
    }
    if (doSetValue) {
      const newState = {
        currInput: value
      }
      if (error) {
        onErrorStateChanged && onErrorStateChanged(false)
        newState.error = null
      }
      this.setState(newState)
    }
  }
  handleTagRequestedDelete = tag => {
    const { tags, onTagsChanged } = this.props
    onTagsChanged(tags.filter(t => t !== tag))
  }
  render () {
    const { currInput, error } = this.state
    const { className, tags } = this.props
    return (
      <div className={className}>
        <div className='flex flex-wrap'>
          {tags.map((tag, idx) => (
            <div className='mr2 mb2' key={idx}>
              <Chip onRequestDelete={() => this.handleTagRequestedDelete(tag)}>
                {tag}
              </Chip>
            </div>
          ))}
        </div>
        <form onSubmit={evt => {
          evt.preventDefault()
          this.convertValueToTags(currInput)
          return false
        }}>
          <TextField
            placeholder='Enter email(s)'
            onChange={this.handleInputChanged}
            value={currInput}
            name='tagCandidatesInput'
            onKeyDown={this.handleKeyDown}
            errorText={error}
            onBlur={() => {
              this.convertValueToTags(currInput)
            }}
          />
          <input type='submit' className='dn' />
        </form>
      </div>
    )
  }
}

TagInput.propTypes = {
  tags: PropTypes.array.isRequired,
  onTagsChanged: PropTypes.func.isRequired,
  className: PropTypes.string,
  validator: PropTypes.func,
  onErrorStateChanged: PropTypes.func
}

export default TagInput
