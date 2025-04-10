import React, { ReactNode } from 'react'
import { FormControl, InputLabel, Box } from '@mui/material'

interface FormFieldProps {
  label: string
  htmlFor: string
  children: ReactNode
  icon?: string
  testId?: string
}

const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, children, icon, testId }) => {
  return (
    <FormControl fullWidth data-testid={testId || `form-field-${htmlFor}`}>
      <InputLabel htmlFor={htmlFor}>{label}</InputLabel>
      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {children}
        {icon && (
          <Box
            component="i"
            className={icon}
            sx={{
              position: 'absolute',
              left: 12,
              color: 'text.secondary',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
    </FormControl>
  )
}

export default FormField
