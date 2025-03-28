import React, { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface EmptyStateProps {
  message: string
  actionText?: string
  actionLink?: string
  actionIcon?: string
  secondaryMessage?: string
  secondaryAction?: ReactNode
}

const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  actionText,
  actionLink,
  actionIcon = 'fas fa-plus',
  secondaryMessage,
  secondaryAction,
}) => {
  return (
    <div className="notification is-light has-text-centered p-6">
      <p className="mb-4">{message}</p>

      {actionLink && actionText && (
        <Link to={actionLink} className="button is-primary">
          {actionIcon && (
            <span className="icon">
              <i className={actionIcon}></i>
            </span>
          )}
          <span>{actionText}</span>
        </Link>
      )}

      {secondaryMessage && <p className="mt-4 mb-4">{secondaryMessage}</p>}
      {secondaryAction}
    </div>
  )
}

export default EmptyState
