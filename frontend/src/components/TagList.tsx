import React from 'react'
import { Box, Chip, SxProps, Theme } from '@mui/material'

interface TagListProps {
  tags: string[]
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
  size?: 'small' | 'medium'
  sx?: SxProps<Theme>
}

const TagList: React.FC<TagListProps> = ({ tags, variant = 'info', size = 'small', sx }) => {
  if (!tags || tags.length === 0) return null

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ...sx }} data-testid="tag-list">
      {tags.map((tag, index) => (
        <Chip
          key={index}
          label={tag}
          color={variant}
          size={size}
          variant="outlined"
          data-testid={`tag-list-item-${tag.toLowerCase().replace(/\s+/g, '-')}`}
        />
      ))}
    </Box>
  )
}

export default TagList
