import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Group as GroupIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material'
import { PageHeader, Breadcrumb } from '../components'
import {
  useGetGroupQuery,
  useGetGroupMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  GroupMember,
} from '../store/api/groupsApi'

const roleOptions = [
  { value: 'member', label: 'Member' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'admin', label: 'Admin' },
]

const GroupMembersPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { data: groupData, isLoading: groupLoading, error: groupError } = useGetGroupQuery(groupId || '')
  const { data: membersData, isLoading: membersLoading } = useGetGroupMembersQuery(groupId || '')

  const [updateMemberRole] = useUpdateMemberRoleMutation()
  const [removeMember] = useRemoveMemberMutation()

  const [openInviteDialog, setOpenInviteDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState<null | HTMLElement>(null)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info'>('success')
  const [showAlert, setShowAlert] = useState(false)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: GroupMember) => {
    setSelectedMember(member)
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionMenuAnchorEl(event.currentTarget)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchorEl(null)
  }

  const handleOpenAddDialog = () => {
    setEmail('')
    setRole('member')
    setOpenInviteDialog(true)
    handleActionMenuClose()
  }

  const handleOpenEditDialog = () => {
    if (selectedMember) {
      setRole(selectedMember.role)
      setOpenEditDialog(true)
      handleMenuClose()
    }
  }

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true)
    handleMenuClose()
  }

  const handleCloseDialogs = () => {
    setOpenInviteDialog(false)
    setOpenEditDialog(false)
    setOpenDeleteDialog(false)
  }

  const handleSendInvitation = async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (data.success) {
        setAlertSeverity('success')
        setAlertMessage('Invitation sent successfully')
        setShowAlert(true)
        handleCloseDialogs()
      } else {
        setAlertSeverity('error')
        setAlertMessage(data.message || 'Failed to send invitation')
        setShowAlert(true)
      }
    } catch (error: unknown) {
      const errorResponse = error as { data?: { error?: string } }
      setAlertSeverity('error')
      setAlertMessage(errorResponse.data?.error || 'Failed to send invitation')
      setShowAlert(true)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedMember) return

    try {
      await updateMemberRole({
        groupId: groupId || '',
        userId: selectedMember.id,
        roleData: { role },
      }).unwrap()

      setAlertSeverity('success')
      setAlertMessage('Member role updated successfully')
      setShowAlert(true)
      handleCloseDialogs()
    } catch (error: unknown) {
      const errorResponse = error as { data?: { message?: string } }
      setAlertSeverity('error')
      setAlertMessage(errorResponse.data?.message || 'Failed to update member role')
      setShowAlert(true)
    }
  }

  const handleRemoveMember = async () => {
    if (!selectedMember) return

    try {
      await removeMember({
        groupId: groupId || '',
        userId: selectedMember.id,
      }).unwrap()

      setAlertSeverity('success')
      setAlertMessage('Member removed successfully')
      setShowAlert(true)
      handleCloseDialogs()
    } catch (error: unknown) {
      const errorResponse = error as { data?: { message?: string } }
      setAlertSeverity('error')
      setAlertMessage(errorResponse.data?.message || 'Failed to remove member')
      setShowAlert(true)
    }
  }

  const handleExportMembers = () => {
    // Create CSV content
    const csvContent = [
      ['Name', 'Email', 'Role'],
      ...members.map((member) => [`${member.firstName} ${member.lastName}`, member.email, member.role]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${group.Name}-members.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    handleActionMenuClose()
  }

  if (groupLoading || membersLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (groupError || !groupData?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading group details. Please try again later.</Alert>
      </Box>
    )
  }

  const { group, userRole } = groupData.data
  const members = membersData?.data || []
  const isAdmin = userRole === 'admin'

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          { label: group.Name, to: `/groups/${group.ID}` },
          { label: 'Members', active: true },
        ]}
      />

      <PageHeader
        title="Manage Members"
        subtitle={`${group.Name} · ${members.length} members`}
        actions={
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isAdmin && (
              <IconButton color="primary" onClick={handleActionMenuOpen} aria-label="member actions">
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>
        }
      />

      {/* Actions Menu */}
      <Menu anchorEl={actionMenuAnchorEl} open={Boolean(actionMenuAnchorEl)} onClose={handleActionMenuClose}>
        <MenuItem onClick={handleOpenAddDialog}>
          <ListItemIcon>
            <PersonAddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Invite Member</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleExportMembers}>
          <ListItemIcon>
            <FileDownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export Members</ListItemText>
        </MenuItem>
      </Menu>

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
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{`${member.firstName} ${member.lastName}`}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        color={member.role === 'admin' ? 'error' : member.role === 'organizer' ? 'warning' : 'info'}
                        size="small"
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, member)}
                          disabled={member.id === groupData.data.group.CreatedBy}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleOpenEditDialog}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Change Role</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenDeleteDialog}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Remove Member</ListItemText>
        </MenuItem>
      </Menu>

      {/* Invite Member Dialog */}
      <Dialog open={openInviteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Invite New Member</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email Address"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address to invite"
            />
            <TextField select label="Role" fullWidth value={role} onChange={(e) => setRole(e.target.value)}>
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleSendInvitation} variant="contained" color="primary">
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Change Member Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Changing role for: {selectedMember?.firstName} {selectedMember?.lastName}
            </Typography>
            <TextField
              select
              label="Role"
              fullWidth
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ mt: 2 }}>
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained" color="primary">
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {selectedMember?.firstName} {selectedMember?.lastName} from the group?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>Cancel</Button>
          <Button onClick={handleRemoveMember} variant="contained" color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShowAlert(false)} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default GroupMembersPage
