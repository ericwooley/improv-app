import React, { ReactNode } from 'react'

interface FormActionsProps {
  children: ReactNode
}

const FormActions: React.FC<FormActionsProps> = ({ children }) => {
  return (
    <div className="field is-grouped mt-5">
      {React.Children.map(children, (child) => (
        <p className="control">{child}</p>
      ))}
    </div>
  )
}

export default FormActions
