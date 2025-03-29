import {
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  List,
  CircularProgress,
  Chip,
  Stack,
  Button,
} from '@mui/material'
import { Mail as MailIcon, Check as AcceptIcon, Person as RoleIcon } from '@mui/icons-material'
import { useGetInvitationsQuery, useAcceptInvitationMutation } from '../store/api/invitationsApi'

// Define API response structure
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
}

// Define Invitation interface
interface Invitation {
  id: string
  groupId: string
  groupName: string
  email: string
  role: string
  status: string
  invitedBy: string
  inviterName: string
  createdAt: string
}

const Invitations = () => {
  const { data: invitationsResponse, isLoading: invitationsLoading } = useGetInvitationsQuery()
  const [acceptInvitation, { isLoading: isAccepting }] = useAcceptInvitationMutation()

  const invitations = (invitationsResponse as unknown as ApiResponse<Invitation[]>)?.data || []

  const handleAcceptInvitation = async (token: string) => {
    try {
      await acceptInvitation({ token }).unwrap()
      // No need to manually update the UI, RTK Query will invalidate and refetch the queries
    } catch (error) {
      console.error('Failed to accept invitation:', error)
    }
  }

  if (invitations.length === 0 && !invitationsLoading) {
    return null
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader title="Pending Invitations" avatar={<MailIcon color="primary" />} />
      <CardContent>
        {invitationsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ width: '100%' }}>
            {invitations.map((invitation) => (
              <Box key={invitation.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="h6">{invitation.groupName}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                  <Chip
                    icon={<RoleIcon fontSize="small" />}
                    label={`Role: ${invitation.role}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip label={`From: ${invitation.inviterName}`} size="small" variant="outlined" />
                </Stack>
                <Button
                  variant="contained"
                  startIcon={<AcceptIcon />}
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={isAccepting}
                  size="small">
                  Accept Invitation
                </Button>
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default Invitations
