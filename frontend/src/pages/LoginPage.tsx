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
  Stack,
} from '@mui/material'
import { Email as EmailIcon, Send as SendIcon, Key as KeyIcon } from '@mui/icons-material'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const dispatch = useAppDispatch()
  const location = useLocation()

  // RTK Query hook for login mutation
  const [login, { isLoading, error }] = useLoginMutation()

  // Check for invite parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const inviteId = params.get('invite')

    if (inviteId) {
      // Store the invite ID in localStorage to redirect after login
      localStorage.setItem('pendingInvite', inviteId)
    }
  }, [location])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

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
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={isLoading}
                sx={{ mt: 3 }}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}>
                Send Magic Link
              </Button>
            </form>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {JSON.stringify(error)}
              </Alert>
            )}
          </Paper>

          <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
            <Typography variant="body2">Don't have an account?</Typography>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Register now
              </Typography>
            </Link>
          </Stack>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage
