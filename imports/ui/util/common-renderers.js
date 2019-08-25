import React from 'react'
import countries from 'iso-3166-1-codes'
import MenuItem from 'material-ui/MenuItem'

export const countryListItems = countries.map(({ alpha2: code, name }) => {
  // Manual ellipsis
  const displayName = name.length > 34 // max tested length on an iphone 5 screen width
    ? name.slice(0, 31) + '...'
    : name
  return (
    {
      text: displayName,
      value: (
        <MenuItem key={code} value={code} primaryText={displayName} />
      )
    }
  )
})
