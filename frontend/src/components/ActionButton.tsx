import React, { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonProps, SvgIconProps } from '@mui/material'
import { styled } from '@mui/material/styles'
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material'

interface ActionButtonProps {
  text: string
  to?: string
  onClick?: () => void
  icon?: ReactElement<SvgIconProps> | string
  variant?: 'contained' | 'outlined' | 'text'
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  fullWidth?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  testId?: string
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
  testId,
}) => {
  // Convert string-based font-awesome icons to MUI icon components
  const getIcon = () => {
    if (!icon) return undefined

    // If icon is already a React element (MUI icon), use it
    if (React.isValidElement(icon)) {
      return icon
    }

    // If using a string (legacy font-awesome), provide a default MUI icon
    return <ChevronRightIcon />
  }

  const buttonProps: ButtonProps = {
    variant,
    color,
    fullWidth,
    size,
    type,
    disabled,
    className,
    startIcon: getIcon(),
  }

  const defaultTestId = `action-button-${text.toLowerCase().replace(/\s+/g, '-')}`
  const finalTestId = testId || defaultTestId

  const content = (
    <Button {...buttonProps} data-testid={finalTestId}>
      {text}
    </Button>
  )

  if (to) {
    return <StyledLink to={to}>{content}</StyledLink>
  }

  return (
    <Button {...buttonProps} onClick={onClick} data-testid={finalTestId}>
      {text}
    </Button>
  )
}

export default ActionButton
