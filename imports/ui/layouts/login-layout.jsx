import React from 'react'
import PropTypes from 'prop-types'
import { UneeTIcon, UneeTLogoText } from '../components/unee-t-icons'

const LoginLayout = ({ subHeading, footerContent, children }) => (
  <div className='w-100 bg-bondi-blue min-h-100vh pt5 roboto'>
    <main className='measure-narrow center tc'>
      <div className='bg-white br3 pv4 ph3'>
        <div className='flex items-center justify-center pb1'>
          <UneeTLogoText sizeMultiplier={1.7} textColor='var(--bondi-blue)' />
          <UneeTIcon className='ml2' isDarkType style={{ width: '3rem', height: '3rem' }} />
        </div>
        <h3 className='f4 fw3 ph0 mh0 mt3 pt2 tc mid-gray'>{subHeading}</h3>
        {children}
      </div>
      {footerContent && (
        <div className='mt3 f6 white lh-title pb4'>
          {footerContent}
        </div>
      )}
    </main>
  </div>
)

LoginLayout.propTypes = {
  subHeading: PropTypes.string.isRequired,
  footerContent: PropTypes.element
}

export default LoginLayout
