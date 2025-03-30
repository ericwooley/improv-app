import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Paper, Typography, Button } from '@mui/material'

interface EmptyStateProps {
  message: string
  actionText?: string
  actionLink?: string
  actionIcon?: string
  secondaryMessage?: string
  secondaryAction?: ReactNode
  onActionClick?: () => void
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  actionText,
  actionLink,
  actionIcon = 'fas fa-plus',
  secondaryMessage,
  secondaryAction,
  onActionClick,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 6,
        textAlign: 'center',
        bgcolor: 'grey.50',
      }}>
      <Typography variant="body1" sx={{ mb: 4 }}>
        {message}
      </Typography>

      {actionText && (actionLink || onActionClick) && (
        <Button
          component={actionLink ? Link : 'button'}
          to={actionLink}
          variant="contained"
          onClick={onActionClick}
          startIcon={actionIcon ? <i className={actionIcon} /> : null}>
          {actionText}
        </Button>
      )}

      {secondaryMessage && (
        <Typography variant="body2" sx={{ mt: 4, mb: 4 }}>
          {secondaryMessage}
        </Typography>
      )}
      {secondaryAction}
    </Paper>
  )
}

export default EmptyState
