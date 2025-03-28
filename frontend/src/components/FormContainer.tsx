import React, { ReactNode } from 'react'

interface FormContainerProps {
  children: ReactNode
  onSubmit: (e: React.FormEvent) => void
}

const FormContainer: React.FC<FormContainerProps> = ({ children, onSubmit }) => {
  return (
    <div className="box">
      <form onSubmit={onSubmit}>{children}</form>
    </div>
  )
}

export default FormContainer
