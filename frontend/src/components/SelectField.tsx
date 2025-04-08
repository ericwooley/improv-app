import React from 'react'
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material'

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
  onChange: (e: SelectChangeEvent<string>) => void
  testId?: string
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
  testId,
}) => {
  return (
    <FormControl fullWidth data-testid={testId || `select-field-${id}`}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        value={value}
        label={label}
        required={required}
        onChange={onChange}
        startAdornment={icon ? <i className={icon} style={{ marginRight: 8, color: 'rgba(0, 0, 0, 0.54)' }} /> : null}>
        <MenuItem value="">
          <em>{placeholder}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default SelectField
