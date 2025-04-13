import React, { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  // Create a slug from the title for the test ID
  const titleSlug = title.toLowerCase().replace(/\s+/g, '-')

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        // justifyContent: 'space-between',
        alignItems: { xs: 'flex-start' },
        mb: 5,
      }}
      data-testid="page-header">
      {actions && (
        <Box sx={{ flex: 0 }} data-testid="page-header-actions">
          {actions}
        </Box>
      )}
      <Box sx={{ mb: { xs: 2, sm: 0 } }}>
        <Typography variant="h2" data-testid={`${titleSlug}-page-title`}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="h5" color="text.secondary" data-testid="page-header-subtitle">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default PageHeader
