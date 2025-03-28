import React, { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor: string
  children: ReactNode
  icon?: string
}

const FormField: React.FC<FormFieldProps> = ({ label, htmlFor, children, icon }) => {
  return (
    <div className="field">
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      <div className={`control ${icon ? 'has-icons-left' : ''}`}>
        {children}
        {icon && (
          <span className="icon is-small is-left">
            <i className={icon}></i>
          </span>
        )}
      </div>
    </div>
  )
}

export default FormField
