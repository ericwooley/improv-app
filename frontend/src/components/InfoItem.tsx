import React, { ReactNode } from 'react'
import { Box, SvgIconProps } from '@mui/material'

interface InfoItemProps {
  icon: React.ReactElement<SvgIconProps>
  children: ReactNode
  className?: string
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, children, className }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 3,
        ...(className && { className }),
      }}>
      <Box
        sx={{
          color: 'info.main',
          mr: 2,
          display: 'flex',
        }}>
        {React.cloneElement(icon, { color: 'info' })}
      </Box>
      {children}
    </Box>
  )
}

export default InfoItem
