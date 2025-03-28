import React from 'react'
import FormField from './FormField'

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
    <FormField label={label} htmlFor={id}>
      <textarea
        id={id}
        className="textarea"
        placeholder={placeholder}
        rows={rows}
        value={value}
        required={required}
        disabled={disabled}
        onChange={onChange}
      />
    </FormField>
  )
}

export default TextareaField
