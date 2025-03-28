import React from 'react'
import FormField from './FormField'

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  id: string
  label: string
  value: string
  options: SelectOption[]
  required?: boolean
  icon?: string
  placeholder?: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  options,
  required = false,
  icon,
  placeholder = 'Select an option...',
  onChange,
}) => {
  return (
    <FormField label={label} htmlFor={id} icon={icon}>
      <div className="select is-fullwidth">
        <select id={id} value={value} required={required} onChange={onChange}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </FormField>
  )
}

export default SelectField
