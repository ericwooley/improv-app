import React from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonProps } from '@mui/material'
import { styled } from '@mui/material/styles'

interface ActionButtonProps {
  text: string
  to?: string
  onClick?: () => void
  icon?: string
  variant?: 'contained' | 'outlined' | 'text'
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  fullWidth?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const StyledLink = styled(Link)({
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
})

const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  to,
  onClick,
  icon,
  variant = 'contained',
  color = 'primary',
  fullWidth = false,
  size = 'medium',
  className = '',
  type = 'button',
  disabled = false,
}) => {
  const buttonProps: ButtonProps = {
    variant,
    color,
    fullWidth,
    size,
    type,
    disabled,
    className,
    startIcon: icon ? <i className={icon} /> : undefined,
  }

  const content = <Button {...buttonProps}>{text}</Button>

  if (to) {
    return <StyledLink to={to}>{content}</StyledLink>
  }

  return (
    <Button {...buttonProps} onClick={onClick}>
      {text}
    </Button>
  )
}

export default ActionButton
