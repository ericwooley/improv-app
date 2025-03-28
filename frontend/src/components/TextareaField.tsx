import React from 'react'
import { TextField } from '@mui/material'

interface TextareaFieldProps {
  id: string
  label: string
  value: string
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  id,
  label,
  value,
  placeholder = '',
  rows = 3,
  required = false,
  disabled = false,
  onChange,
}) => {
  return (
    <TextField
      id={id}
      label={label}
      multiline
      rows={rows}
      placeholder={placeholder}
      value={value}
      required={required}
      disabled={disabled}
      onChange={onChange}
      fullWidth
    />
  )
}

export default TextareaField
