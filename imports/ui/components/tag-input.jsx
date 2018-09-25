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
  handleKeyDown = evt => {
    const { tags, onTagsChanged, validator, onErrorStateChanged } = this.props
    const { currInput, error } = this.state
    switch (evt.nativeEvent.code) {
      case 'Space':
      case 'Comma':
      case 'Enter':
        evt.preventDefault()
        if (!currInput) return
        const newError = validator && validator(currInput)
        if (newError) {
          onErrorStateChanged && onErrorStateChanged(true)
          this.setState({error: newError})
        } else {
          onTagsChanged(tags.concat([currInput]))
          this.setState({
            currInput: ''
          })
        }
        break
      case 'Backspace':
        if (currInput === '') {
          onTagsChanged(tags.slice(0, -1))
        }
        break
      default:
        if (error) {
          onErrorStateChanged && onErrorStateChanged(false)
          this.setState({error: null})
        }
    }
  }
  handleInputChanged = (evt, value) => {
    this.setState({currInput: value})
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
        <TextField
          placeholder='Enter email(s)'
          onChange={this.handleInputChanged}
          value={currInput}
          onKeyDown={this.handleKeyDown}
          errorText={error}
        />
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
