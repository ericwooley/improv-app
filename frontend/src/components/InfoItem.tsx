import React, { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

interface InfoItemProps {
  icon: string
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
        component="i"
        className={icon}
        sx={{
          color: 'info.main',
          mr: 2,
        }}
      />
      <Typography>{children}</Typography>
    </Box>
  )
}

export default InfoItem
