import { useState, FormEvent, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLoginMutation } from '../store/api/authApi'
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
} from '@mui/material'
import { Email as EmailIcon, Send as SendIcon, Key as KeyIcon } from '@mui/icons-material'

// Map of error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'The verification link is invalid or missing a required token.',
  invalid_token: 'The verification link has expired or is invalid. Please request a new one.',
  default: 'An error occurred during sign in. Please try again.',
}

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const location = useLocation()

  // RTK Query hook for login mutation
  const [login, { isLoading }] = useLoginMutation()

  // Check for error parameters in URL on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const errorCode = queryParams.get('error')

    if (errorCode) {
      const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default
      setLoginError(errorMessage)
    }
  }, [location.search])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    if (!agreedToTerms) {
      alert('Please agree to the Privacy Policy and Terms of Service to continue.')
      return
    }

    try {
      const response = await login({ email }).unwrap()
      // Update Redux state with the user info
      dispatch(setCredentials(response.user))

      // Show success message - in a real app you might want to redirect
      // or handle this differently depending on your authentication flow
      alert('Magic link has been sent to your email. Please check your inbox.')
    } catch (err) {
      // Error is handled by RTK Query and available in the error variable
      console.error('Failed to send magic link:', err)
      setLoginError('Failed to send magic link. Please try again later.')
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
          <Typography variant="h4" component="h1" gutterBottom>
            Sign In
          </Typography>

          {loginError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }} data-testid="login-error-alert">
              {loginError}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ p: 3, width: '100%', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Enter Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter your email address and we'll send you a magic link to sign in.
            </Typography>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                id="email"
                label="Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                sx={{ mt: 2 }}
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                data-testid="login-email-input"
              />

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
                disabled={isLoading || !agreedToTerms}
                sx={{ mt: 3 }}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
                data-testid="login-submit-button">
                Send Magic Link
              </Button>
            </form>
          </Paper>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage
