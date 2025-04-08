import React from 'react'
import { TextField } from '@mui/material'

interface InputFieldProps {
  id: string
  label: string
  value: string
  type?: string
  placeholder?: string
  required?: boolean
  icon?: string
  disabled?: boolean
  last?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  testId?: string
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  value,
  type = 'text',
  placeholder = '',
  required = false,
  icon,
  disabled = false,
  last = false,
  onChange,
  testId,
}) => {
  return (
    <TextField
      id={id}
      label={label}
      type={type}
      placeholder={placeholder}
      value={value}
      required={required}
      disabled={disabled}
      onChange={onChange}
      fullWidth
      sx={{ mb: last ? 0 : 2 }}
      InputProps={{
        startAdornment: icon ? <i className={icon} style={{ marginRight: 8, color: 'rgba(0, 0, 0, 0.54)' }} /> : null,
      }}
      data-testid={testId || `input-field-${id}`}
    />
  )
}

export default InputField
