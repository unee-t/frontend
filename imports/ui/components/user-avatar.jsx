// @flow
import * as React from 'react'

// $FlowFixMe
import styles from './user-themes.mss'
import { fitDimensions } from '../../util/cloudinary-transformations'

type Props = {
  user: {
    name?: string,
    login?: string,
    email?: string
  },
  isSmall?: boolean,
  isBig?: boolean,
  additionalClasses?: string,
  imageUrl?: string
}
type State = {
  isImageLoaded: boolean,
  effectPending: boolean
}
export default class UserAvatar extends React.Component<Props, State> {
  state = {
    isImageLoaded: false,
    effectPending: false
  }

  componentDidMount () {
    setTimeout(() => {
      this.setState({
        effectPending: true
      })
    }, 200)
  }
  render () {
    const { user, isSmall, isBig, additionalClasses, imageUrl } = this.props
    const { isImageLoaded, effectPending } = this.state
    const userDisplayText = user.name || user.login || user.email || ''
    const classes = [
      styles.userAvatar,
      styles.sized,
      'dib v-btm br-100 tc white relative overflow-hidden'
    ]
    if (isSmall) classes.push(styles.size2)
    else if (isBig) classes.push(styles.size3, 'f3')
    else classes.push(styles.size1)

    if (additionalClasses) classes.push(additionalClasses)
    return (
      <div className={classes.join(' ')}>
        {userDisplayText.slice(0, 1).toUpperCase()}
        {imageUrl && (
          <div className='absolute top-0 bottom-0 right-0 left-0'>
            <img
              className={'w-100 obj-cover transition-o-filter ' + ((!isImageLoaded && effectPending) ? 'o-0 blur-1' : 'o-100')}
              src={fitDimensions(imageUrl, 64, 64)}
              onLoad={() => this.setState({ isImageLoaded: true })}
            />
          </div>
        )}
      </div>
    )
  }
}
