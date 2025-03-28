import React, { ReactNode } from 'react'
import { Paper } from '@mui/material'

interface FormContainerProps {
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
}

const FormContainer: React.FC<FormContainerProps> = ({ children, onSubmit }) => {
  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <form onSubmit={onSubmit}>{children}</form>
    </Paper>
  )
}

export default FormContainer
