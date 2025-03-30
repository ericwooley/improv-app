import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  actions?: React.ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  fullWidth = true,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          m: 2,
          width: '100%',
          maxHeight: '90vh',
          position: 'relative',
          ...(isMobile && {
            m: 0,
            height: '100%',
            maxHeight: '100%',
          }),
        },
      }}>
      {title && (
        <DialogTitle sx={{ m: 0, p: 2, pr: 6 }}>
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent dividers sx={{ p: 2 }}>
        <Box sx={{ overflowY: 'auto' }}>{children}</Box>
      </DialogContent>
      {actions && <DialogActions sx={{ p: 2, pt: 0 }}>{actions}</DialogActions>}
    </Dialog>
  )
}

export default Modal
