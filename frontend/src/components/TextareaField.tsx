import React from 'react'
import { TextField } from '@mui/material'

interface TextareaFieldProps {
  id: string
  name?: string
  label: string
  value: string
  placeholder?: string
  rows?: number
  required?: boolean
  last?: boolean
  disabled?: boolean
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  testId?: string
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  id,
  name = id,
  label,
  value,
  placeholder = '',
  rows = 3,
  required = false,
  disabled = false,
  last = false,
  onChange,
  testId,
}) => {
  return (
    <TextField
      id={id}
      name={name}
      label={label}
      multiline
      rows={rows}
      placeholder={placeholder}
      value={value}
      required={required}
      disabled={disabled}
      onChange={onChange}
      fullWidth
      sx={{ mb: last ? 0 : 2 }}
      data-testid={testId || `textarea-field-${id}`}
    />
  )
}

export default TextareaField
