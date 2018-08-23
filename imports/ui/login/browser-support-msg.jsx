import React from 'react'
// import LoginLayout from '../layouts/login-layout'
import { UneeTIcon, UneeTLogoText } from '../components/unee-t-icons'

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
    <div className='w-100 bg-bondi-blue min-h-100vh pt5 roboto'>
      <main className='measure-narrow center tc'>
        <div className='bg-white br3 pv4 ph3'>
          <div className='flex items-center justify-center pb1'>
            <UneeTLogoText sizeMultiplier={1.7} textColor='var(--bondi-blue)' />
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
