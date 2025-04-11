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
      }}
      data-testid="info-item">
      <Box
        sx={{
          color: 'info.main',
          mr: 2,
          display: 'flex',
        }}
        data-testid="info-item-icon">
        {React.cloneElement(icon, { color: 'info' })}
      </Box>
      <Box data-testid="info-item-content">{children}</Box>
    </Box>
  )
}

export default InfoItem
