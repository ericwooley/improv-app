import React, { ReactNode } from 'react'
import { Stack } from '@mui/material'

interface FormActionsProps {
  children: ReactNode
}

const FormActions: React.FC<FormActionsProps> = ({ children }) => {
  return (
    <Stack direction="row" spacing={2} sx={{ mt: 5 }}>
      {React.Children.map(children, (child) => (
        <div>{child}</div>
      ))}
    </Stack>
  )
}

export default FormActions
