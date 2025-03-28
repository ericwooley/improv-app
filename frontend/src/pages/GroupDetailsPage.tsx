import { useParams } from 'react-router-dom'
import { useGetGroupQuery } from '../store/api/groupsApi'
import { PageHeader, Breadcrumb, ActionButton, InfoItem, formatDate } from '../components'
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Chip,
} from '@mui/material'
import { Info as InfoIcon, Group as GroupIcon, Settings as SettingsIcon } from '@mui/icons-material'

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { data: groupResponse, isLoading, error } = useGetGroupQuery(groupId || '')

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !groupResponse?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading group details. Please try again later.</Alert>
      </Box>
    )
  }

  const { group, members, userRole } = groupResponse.data

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          { label: group.Name, active: true },
        ]}
      />

      <PageHeader title={group.Name} subtitle={group.Description} />

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: { md: 2 } }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader avatar={<InfoIcon />} title="Group Information" />
            <CardContent>
              <Stack spacing={2}>
                <InfoItem icon="fas fa-calendar-alt">Created {formatDate(new Date(group.CreatedAt))}</InfoItem>
                <InfoItem icon="fas fa-user-shield">Your Role: {userRole}</InfoItem>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader avatar={<GroupIcon />} title="Members" />
            <CardContent>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{`${member.firstName} ${member.lastName}`}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Chip label={member.role} color={member.role === 'admin' ? 'error' : 'info'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { md: 1 } }}>
          <Card>
            <CardHeader avatar={<SettingsIcon />} title="Actions" />
            <CardContent>
              <Stack spacing={2}>
                <ActionButton
                  text="Create Event"
                  to={`/events/new?groupId=${group.ID}`}
                  icon="fas fa-calendar-plus"
                  fullWidth
                />
                {userRole === 'admin' && (
                  <>
                    <ActionButton
                      text="Edit Group"
                      to={`/groups/${group.ID}/edit`}
                      icon="fas fa-edit"
                      color="warning"
                      fullWidth
                    />
                    <ActionButton
                      text="Manage Members"
                      to={`/groups/${group.ID}/members`}
                      icon="fas fa-user-cog"
                      color="info"
                      fullWidth
                    />
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default GroupDetailsPage
