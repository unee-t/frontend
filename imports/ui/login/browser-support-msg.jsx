import React from 'react'
import PropTypes from 'prop-types'

export const UneeTIcon = ({isDarkType, ...otherProps}) => (
  <svg {...otherProps} viewBox={isDarkType ? '0 0 119.19 119.33' : '3 3 39 39'}>
    <use xlinkHref={`/unee-t_logo${isDarkType ? '' : '_reverse'}.svg#icon`} />
  </svg>
)

UneeTIcon.propTypes = {
  isDarkType: PropTypes.bool
}

const LogoTextStyle = {
  width: 106,
  height: 27
}
export const UneeTLogoText = ({sizeMultiplier, textColor, ...moreProps}) => {
  const mult = sizeMultiplier || 1
  const { width, height } = LogoTextStyle
  return (
    <svg viewBox='0 0 106 27' {...moreProps}
      style={{color: textColor || '#FFFFFF', width: width * mult, height: height * mult}}>
      <use xlinkHref='/unee-t_wordmark.svg#logo-text' />
    </svg>
  )
}
UneeTLogoText.propTypes = {
  textColor: PropTypes.string,
  sizeMultiplier: PropTypes.number
}

const browserTypes = [
  {icon: <i className='fab fa-chrome f2' />, name: 'Chrome'},
  {icon: <i className='fab fa-firefox f2' />, name: 'Firefox'},
  {icon: <i className='fab fa-safari f2' />, name: 'Safari'}
]

const supportedBrowsers = browserTypes.map((browser, i) =>
  <div className={'f6 fw5 ph3 silver'} key={i}>
    <div key={browser.icon}>
      {browser.icon}
    </div>
    <div key={browser.name}>
      {browser.name}
    </div>
  </div>
)

export function BrowserSupportMsg () {
  return (
    <div className='w-100 min-h-100vh pt5 roboto' style={{backgroundColor: '#0095b6'}}>
      <main className='measure-narrow center tc'>
        <div className='bg-white br3 pv4 ph3'>
          <div className='flex items-center justify-center pb1'>
            <UneeTLogoText sizeMultiplier={1.7} textColor='#0095b6' />
            <UneeTIcon className='ml2' isDarkType style={{width: '3rem', height: '3rem'}} />
          </div>
          <h3 className='f4 fw3 ph0 mh0 mt3 pt2 tc mid-gray'>The smarter way to manage issues in your units</h3>
          <div className='silver f6'>
            We recommend using Unee-T App with one of the following browsers:
          </div>
          <div className='flex pl4 pv3 bb b--very-light-gray bg-white'>
            {supportedBrowsers}
          </div>
        </div>
      </main>
    </div>
  )
}
