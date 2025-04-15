import { useState, FormEvent, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLoginMutation, useRegisterMutation } from '../store/api/authApi'
import { useAppDispatch } from '../store/hooks'
import { setCredentials } from '../store/slices/authSlice'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Checkbox,
  FormControlLabel,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material'
import {
  Email as EmailIcon,
  Send as SendIcon,
  Key as KeyIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  AlternateEmail as MagicLinkIcon,
  Password as PasswordIcon,
} from '@mui/icons-material'

// Map of error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'The verification link is invalid or missing a required token.',
  invalid_token: 'The verification link has expired or is invalid. Please request a new one.',
  default: 'An error occurred during sign in. Please try again.',
}

// Add query parameter to sync tab selection with URL
const getTabFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('tab-auth') === 'register' ? 1 : 0
}

const updateUrlWithTab = (tabIndex: number) => {
  const params = new URLSearchParams(window.location.search)
  params.set('tab-auth', tabIndex === 1 ? 'register' : 'login')
  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
}

const LoginPage = () => {
  // State for tab and login method
  const [activeTab, setActiveTab] = useState(getTabFromUrl())
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('magic-link')

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()

  // RTK Query hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation()
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation()

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)
    setEmailError(isValid ? null : 'Please enter a valid email address')
    return isValid
  }

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return false
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      setPasswordError('Password must contain at least one number')
      return false
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setPasswordError('Password must contain at least one special character')
      return false
    }

    setPasswordError(null)
    return true
  }

  const validateConfirmPassword = (password: string, confirmPassword: string): boolean => {
    const isValid = password === confirmPassword
    setConfirmPasswordError(isValid ? null : 'Passwords do not match')
    return isValid
  }

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    updateUrlWithTab(newValue)
    // Reset form state and errors
    setLoginError(null)
    setEmailError(null)
    setPasswordError(null)
    setConfirmPasswordError(null)
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setAgreedToTerms(false)
  }

  // Handle input changes with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    // Only validate if there's content or if there was a previous error
    if (newEmail || emailError) {
      validateEmail(newEmail)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    // Only validate if there's content or if there was a previous error
    if (newPassword || passwordError) {
      validatePassword(newPassword)
    }

    // Validate confirm password if it has content
    if (confirmPassword) {
      validateConfirmPassword(newPassword, confirmPassword)
    }
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value
    setConfirmPassword(newConfirmPassword)
    if (newConfirmPassword || confirmPasswordError) {
      validateConfirmPassword(password, newConfirmPassword)
    }
  }

  // Handle login method change
  const handleLoginMethodChange = (_event: React.MouseEvent<HTMLElement>, newMethod: 'password' | 'magic-link') => {
    if (newMethod !== null) {
      setLoginMethod(newMethod)
      setLoginError(null)
    }
  }

  // Check for error parameters in URL on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const errorCode = queryParams.get('error')

    if (errorCode) {
      const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default
      setLoginError(errorMessage)
    }
  }, [location.search])

  // Handle login form submission
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    // Validate inputs
    const isEmailValid = validateEmail(email)
    let isPasswordValid = true

    if (loginMethod === 'password') {
      isPasswordValid = password.length > 0 // Simple check for login
      if (!isPasswordValid) {
        setPasswordError('Please enter your password')
      }
    }

    if (!isEmailValid || (loginMethod === 'password' && !isPasswordValid)) {
      return
    }

    if (!agreedToTerms) {
      alert('Please agree to the Privacy Policy and Terms of Service to continue.')
      return
    }

    try {
      // Different payload based on login method
      const payload =
        loginMethod === 'password' ? { email, password, method: loginMethod } : { email, method: loginMethod }

      const response = await login(payload).unwrap()

      // Update Redux state with the user info
      dispatch(setCredentials(response.user))

      if (loginMethod === 'magic-link') {
        // Show success message for magic link
        alert('Magic link has been sent to your email. Please check your inbox.')
      } else {
        // Redirect for password login
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login failed:', err)
      setLoginError(
        loginMethod === 'magic-link'
          ? 'Failed to send magic link. Please try again later.'
          : 'Login failed. Please check your email and password.'
      )
    }
  }

  // Handle registration form submission
  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    // Validate all inputs
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    const doPasswordsMatch = validateConfirmPassword(password, confirmPassword)

    if (!isEmailValid || !isPasswordValid || !doPasswordsMatch) {
      return
    }

    if (!agreedToTerms) {
      alert('Please agree to the Privacy Policy and Terms of Service to continue.')
      return
    }

    try {
      const response = await register({ email, password }).unwrap()

      // Update Redux state with the user info
      dispatch(setCredentials(response.user))

      // Redirect to dashboard after successful registration
      navigate('/dashboard')
    } catch (err) {
      console.error('Registration failed:', err)
      setLoginError('Registration failed. Please try again later.')
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
          <IconButton color="primary" size="large" sx={{ mb: 2 }}>
            <KeyIcon sx={{ fontSize: 48 }} />
          </IconButton>

          {/* Tabs to switch between login and register */}
          <Tabs value={activeTab} onChange={handleTabChange} sx={{ width: '100%', mb: 3 }} data-testid="auth-tabs">
            <Tab label="Sign In" data-testid="login-tab" />
            <Tab label="Register" data-testid="register-tab" />
          </Tabs>

          {loginError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }} data-testid="auth-error-alert">
              {loginError}
            </Alert>
          )}

          {/* Login Tab Panel */}
          {activeTab === 0 && (
            <Paper variant="outlined" sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Sign In
              </Typography>

              {/* Toggle between login methods */}
              <ToggleButtonGroup
                value={loginMethod}
                exclusive
                onChange={handleLoginMethodChange}
                aria-label="login method"
                sx={{ width: '100%', mb: 2 }}
                data-testid="login-method-toggle">
                <ToggleButton value="magic-link" aria-label="magic link login" data-testid="magic-link-login-button">
                  <MagicLinkIcon sx={{ mr: 1 }} />
                  Magic Link
                </ToggleButton>
                <ToggleButton value="password" aria-label="password login" data-testid="password-login-button">
                  <PasswordIcon sx={{ mr: 1 }} />
                  Password
                </ToggleButton>
              </ToggleButtonGroup>

              <form onSubmit={handleLoginSubmit}>
                <TextField
                  fullWidth
                  id="login-email"
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  error={!!emailError}
                  helperText={emailError}
                  disabled={isLoginLoading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  data-testid="login-email-input"
                />

                {loginMethod === 'password' && (
                  <TextField
                    fullWidth
                    id="login-password"
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    error={!!passwordError}
                    helperText={passwordError}
                    disabled={isLoginLoading}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    data-testid="login-password-input"
                  />
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      color="primary"
                      data-testid="login-terms-checkbox"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link
                        to="/privacy-policy"
                        style={{ textDecoration: 'none' }}
                        data-testid="login-privacy-policy-link">
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/terms-of-service"
                        style={{ textDecoration: 'none' }}
                        data-testid="login-terms-of-service-link">
                        Terms of Service
                      </Link>
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isLoginLoading || !agreedToTerms}
                  sx={{ mt: 3 }}
                  startIcon={isLoginLoading ? <CircularProgress size={20} /> : <SendIcon />}
                  data-testid="login-submit-button">
                  {loginMethod === 'password' ? 'Sign In' : 'Send Magic Link'}
                </Button>
              </form>
            </Paper>
          )}

          {/* Register Tab Panel */}
          {activeTab === 1 && (
            <Paper variant="outlined" sx={{ p: 3, width: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Create an Account
              </Typography>

              <form onSubmit={handleRegisterSubmit}>
                <TextField
                  fullWidth
                  id="register-email"
                  label="Email Address"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  error={!!emailError}
                  helperText={emailError}
                  disabled={isRegisterLoading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  data-testid="register-email-input"
                />

                <TextField
                  fullWidth
                  id="register-password"
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  error={!!passwordError}
                  helperText={passwordError}
                  disabled={isRegisterLoading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  data-testid="register-password-input"
                />

                <TextField
                  fullWidth
                  id="register-confirm-password"
                  label="Confirm Password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  error={!!confirmPasswordError}
                  helperText={confirmPasswordError}
                  disabled={isRegisterLoading}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  data-testid="register-confirm-password-input"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      color="primary"
                      data-testid="register-terms-checkbox"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      I agree to the{' '}
                      <Link
                        to="/privacy-policy"
                        style={{ textDecoration: 'none' }}
                        data-testid="register-privacy-policy-link">
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/terms-of-service"
                        style={{ textDecoration: 'none' }}
                        data-testid="register-terms-of-service-link">
                        Terms of Service
                      </Link>
                    </Typography>
                  }
                  sx={{ mt: 2 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isRegisterLoading || !agreedToTerms}
                  sx={{ mt: 3 }}
                  startIcon={isRegisterLoading ? <CircularProgress size={20} /> : <PersonIcon />}
                  data-testid="register-submit-button">
                  Create Account
                </Button>
              </form>
            </Paper>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Not ready to create an account yet?{' '}
              <Link to="/games" style={{ textDecoration: 'none' }} data-testid="browse-games-link">
                Browse our public games
              </Link>{' '}
              without signing in.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage
