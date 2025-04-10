import React, { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 5,
      }}>
      <Box sx={{ mb: { xs: 2, sm: 0 } }}>
        <Typography variant="h2">{title}</Typography>
        {subtitle && (
          <Typography variant="h5" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ mt: { xs: 2, sm: 0 } }}>{actions}</Box>}
    </Box>
  )
}

export default PageHeader
