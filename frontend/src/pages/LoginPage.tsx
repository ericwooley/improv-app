import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
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

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const dispatch = useAppDispatch()

  // RTK Query hook for login mutation
  const [login, { isLoading, error }] = useLoginMutation()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

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

            {error && (
              <Alert severity="error" sx={{ mt: 2 }} data-testid="login-error-alert">
                {JSON.stringify(error)}
              </Alert>
            )}
          </Paper>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage
