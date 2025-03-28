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
    <Box sx={{ mb: 5 }}>
      <Breadcrumbs
        aria-label="breadcrumb"
        separator={separator === 'arrow' ? '›' : separator === 'bullet' ? '•' : separator === 'dot' ? '.' : '≻'}>
        <>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              {item.active ? (
                <Typography color="text.primary">{item.label}</Typography>
              ) : item.to ? (
                <MuiLink component={Link} to={item.to} color="inherit" underline="hover">
                  {item.label}
                </MuiLink>
              ) : (
                <Typography color="text.secondary">{item.label}</Typography>
              )}
            </React.Fragment>
          ))}
        </>
      </Breadcrumbs>
    </Box>
  )
}

export default Breadcrumb
