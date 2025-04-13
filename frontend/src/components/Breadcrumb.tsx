import React from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumbs, Link as MuiLink, Typography, Box } from '@mui/material'

interface BreadcrumbItem {
  label: string
  to?: string
  active?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: 'arrow' | 'bullet' | 'dot' | 'succeeds'
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, separator = 'arrow' }) => {

  return (
    <Box sx={{ mb: 5 }} data-testid="breadcrumb-container">
      <Breadcrumbs
        aria-label="breadcrumb"
        data-testid="breadcrumb-nav"
        separator={separator === 'arrow' ? '›' : separator === 'bullet' ? '•' : separator === 'dot' ? '.' : '≻'}>
        {items.map((item, index) =>
          item.active ? (
            <Typography
              key={index}
              color="text.primary"
              data-testid={`breadcrumb-item-active-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </Typography>
          ) : item.to ? (
            <MuiLink
              key={index}
              component={Link}
              to={item.to}
              color="inherit"
              underline="hover"
              data-testid={`breadcrumb-item-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </MuiLink>
          ) : (
            <Typography
              key={index}
              color="text.secondary"
              data-testid={`breadcrumb-item-text-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              {item.label}
            </Typography>
          )
        )}
      </Breadcrumbs>
    </Box>
  )
}

export default Breadcrumb
