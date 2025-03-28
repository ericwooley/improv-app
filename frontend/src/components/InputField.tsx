import React from 'react'
import FormField from './FormField'

interface InputFieldProps {
  id: string
  label: string
  value: string
  type?: string
  placeholder?: string
  required?: boolean
  icon?: string
  disabled?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
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
  onChange,
}) => {
  return (
    <FormField label={label} htmlFor={id} icon={icon}>
      <input
        type={type}
        id={id}
        className="input"
        placeholder={placeholder}
        value={value}
        required={required}
        disabled={disabled}
        onChange={onChange}
      />
    </FormField>
  )
}

export default InputField
