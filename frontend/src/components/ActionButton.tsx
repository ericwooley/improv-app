import React from 'react'
import { Link } from 'react-router-dom'

interface ActionButtonProps {
  text: string
  to?: string
  onClick?: () => void
  icon?: string
  variant?: 'primary' | 'info' | 'danger' | 'link' | 'success' | 'light'
  outlined?: boolean
  fullWidth?: boolean
  size?: 'small' | 'normal' | 'medium' | 'large'
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  to,
  onClick,
  icon,
  variant = 'primary',
  outlined = false,
  fullWidth = false,
  size,
  className = '',
  type = 'button',
  disabled = false,
}) => {
  const buttonClassName = [
    'button',
    `is-${variant}`,
    outlined ? 'is-outlined' : '',
    fullWidth ? 'is-fullwidth' : '',
    size ? `is-${size}` : '',
    disabled ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {icon && (
        <span className="icon">
          <i className={icon}></i>
        </span>
      )}
      <span>{text}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={buttonClassName}>
        {content}
      </Link>
    )
  }

  return (
    <button className={buttonClassName} onClick={onClick} type={type} disabled={disabled}>
      {content}
    </button>
  )
}

export default ActionButton
