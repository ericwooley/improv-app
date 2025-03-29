import React from 'react'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
  id?: string
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, id = 'section', ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${id}-tabpanel-${index}`}
      aria-labelledby={`${id}-tab-${index}`}
      {...other}>
      {value === index && children}
    </div>
  )
}

export function a11yProps(index: number, id = 'section') {
  return {
    id: `${id}-tab-${index}`,
    'aria-controls': `${id}-tabpanel-${index}`,
  }
}

export default TabPanel
