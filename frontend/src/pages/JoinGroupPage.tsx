import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stack,
} from '@mui/material'
import { Group as GroupIcon, Check as AcceptIcon, Close as RejectIcon } from '@mui/icons-material'
import { useJoinGroupViaInviteMutation, useVerifyInviteLinkQuery } from '../store/api/groupsApi'

const JoinGroupPage = () => {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [joinGroup, { isLoading: isJoining }] = useJoinGroupViaInviteMutation()
  const {
    data: inviteData,
    isLoading: isVerifying,
    error: verifyError,
  } = useVerifyInviteLinkQuery(code || '', {
    skip: !code,
  })
  const [error, setError] = useState<string | null>(null)

  const handleJoinGroup = async () => {
    try {
      if (!code) return

      const result = await joinGroup(code).unwrap()

      // If successful, navigate to the groups page
      if (result.success) {
        navigate(`/groups/${result.data.ID}`)
      }
    } catch (err: unknown) {
      const errorMsg =
        err &&
        typeof err === 'object' &&
        'data' in err &&
        typeof err.data === 'object' &&
        err.data &&
        'message' in err.data
          ? String(err.data.message)
          : 'Failed to join group'

      setError(errorMsg)
      console.error('Error joining group:', err)
    }
  }

  const handleDecline = () => {
    // Just navigate back to groups page
    navigate('/groups')
  }

  if (isVerifying) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  // Check for verification errors
  if (verifyError) {
    const errorMessage =
      verifyError && typeof verifyError === 'object' && 'data' in verifyError
        ? String((verifyError.data as { message?: string })?.message || 'Invalid invitation code')
        : 'Failed to verify invitation'

    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
        <Button component={Link} to="/groups" variant="contained">
          Go to Groups
        </Button>
      </Box>
    )
  }

  // Check for custom errors during join
  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={Link} to="/groups" variant="contained">
          Go to Groups
        </Button>
      </Box>
    )
  }

  // If no group info available
  if (!inviteData?.data) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Alert severity="warning">No group information available</Alert>
      </Box>
    )
  }

  const groupInfo = inviteData.data

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card>
        <CardHeader
          title="Group Invitation"
          avatar={<GroupIcon color="primary" />}
          sx={{ borderBottom: '1px solid #eee' }}
        />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {groupInfo.Name}
            </Typography>
            {groupInfo.Description && (
              <Typography variant="body1" color="text.secondary" paragraph>
                {groupInfo.Description}
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" gutterBottom>
              You've been invited to join this improv group.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<AcceptIcon />}
                onClick={handleJoinGroup}
                disabled={isJoining}
                fullWidth>
                {isJoining ? <CircularProgress size={24} /> : 'Join Group'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RejectIcon />}
                onClick={handleDecline}
                disabled={isJoining}
                color="error"
                fullWidth>
                Decline
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default JoinGroupPage
