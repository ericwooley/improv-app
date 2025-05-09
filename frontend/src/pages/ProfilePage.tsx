import { useState, useEffect } from 'react'
import { useGetMeQuery, useUpdateProfileMutation } from '../store/api/authApi'
import { Box, Typography, TextField, Button, Paper, CircularProgress, Alert, Stack } from '@mui/material'
import { Save as SaveIcon, Person as PersonIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
  })
  const navigate = useNavigate()

  // Get the user data using RTK Query
  const { data: userResponse, isLoading: isLoadingUser } = useGetMeQuery()
  const { data: user } = userResponse || {}
  // Update profile mutation
  const [updateProfile, { isLoading: isUpdating, error: updateError, isSuccess }] = useUpdateProfileMutation()

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
      }).unwrap()
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  if (isLoadingUser) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }} data-testid="profile-loading">
        <Typography variant="h5" sx={{ mb: 2 }}>
          Loading profile...
        </Typography>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box data-testid="profile-page">
      <Typography variant="h4" sx={{ mb: 1 }} data-testid="profile-title">
        My Profile
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }} data-testid="profile-subtitle">
        Manage your personal information
      </Typography>

      {isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} data-testid="profile-success-alert">
          Profile updated successfully!
        </Alert>
      )}

      {updateError && (
        <Alert severity="error" sx={{ mb: 3 }} data-testid="profile-error-alert">
          {JSON.stringify(updateError)}
        </Alert>
      )}

      <Paper elevation={0} component="form" onSubmit={handleSubmit} sx={{ p: 3 }} data-testid="profile-form">
        <Stack spacing={3}>
          <TextField
            id="firstName"
            label="First Name"
            value={profile.firstName}
            placeholder="Enter your first name, or something people can recognize you by"
            required
            fullWidth
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            data-testid="profile-first-name-input"
          />

          <TextField
            id="lastName"
            label="Last Name"
            value={profile.lastName}
            placeholder="Enter your last name, or something people can recognize you by"
            required
            fullWidth
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            data-testid="profile-last-name-input"
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              disabled={isUpdating}
              data-testid="profile-cancel-button">
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              startIcon={<SaveIcon />}
              disabled={isUpdating}
              data-testid="profile-update-button">
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}

export default ProfilePage
