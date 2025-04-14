import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
} from '@mui/material'
import {
  CheckCircle as AttendingIcon,
  HelpOutline as MaybeIcon,
  Cancel as DeclinedIcon,
  Edit as EditIcon,
  HourglassEmpty as AwaitingIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { RSVP, NonRegisteredAttendee } from '../../store/api/eventsApi'
import {
  useUpdateUserRSVPMutation,
  useGetNonRegisteredAttendeesQuery,
  useAddNonRegisteredAttendeeMutation,
  useUpdateNonRegisteredAttendeeMutation,
  useDeleteNonRegisteredAttendeeMutation,
} from '../../store/api/eventsApi'

interface AttendanceListProps {
  rsvps: RSVP[]
  eventId: string
  canManageAttendance: boolean
}

const AttendanceList = ({ rsvps, eventId, canManageAttendance }: AttendanceListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [addAttendeeDialogOpen, setAddAttendeeDialogOpen] = useState(false)
  const [nonRegisteredAttendeeForm, setNonRegisteredAttendeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [editAttendeeDialogOpen, setEditAttendeeDialogOpen] = useState(false)
  const [editingAttendeeId, setEditingAttendeeId] = useState<string | null>(null)

  // API Mutations and Queries
  const [updateUserRSVP, { isLoading: isUpdating }] = useUpdateUserRSVPMutation()
  const { data: nonRegisteredAttendeesData, isLoading: isLoadingNonRegistered } =
    useGetNonRegisteredAttendeesQuery(eventId)
  const [addNonRegisteredAttendee, { isLoading: isAddingAttendee }] = useAddNonRegisteredAttendeeMutation()
  const [updateNonRegisteredAttendee, { isLoading: isUpdatingAttendee }] = useUpdateNonRegisteredAttendeeMutation()
  const [deleteNonRegisteredAttendee] = useDeleteNonRegisteredAttendeeMutation()

  const nonRegisteredAttendees = nonRegisteredAttendeesData?.data || []

  // Count summary for registered attendees
  const summary = useMemo(() => {
    return {
      attending: rsvps.filter((rsvp) => rsvp.status === 'attending').length,
      maybe: rsvps.filter((rsvp) => rsvp.status === 'maybe').length,
      declined: rsvps.filter((rsvp) => rsvp.status === 'declined').length,
      awaiting: rsvps.filter((rsvp) => rsvp.status === 'awaiting-response').length,
      total: rsvps.length,
      nonRegistered: nonRegisteredAttendees.length,
      totalAttending: rsvps.filter((rsvp) => rsvp.status === 'attending').length + nonRegisteredAttendees.length,
    }
  }, [rsvps, nonRegisteredAttendees])

  // Filter RSVPs
  const filteredRSVPs = useMemo(() => {
    return rsvps.filter((rsvp) => {
      return statusFilter === 'all' || rsvp.status === statusFilter
    })
  }, [rsvps, statusFilter])

  // Get status chip
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'attending':
        return <Chip icon={<AttendingIcon />} label="Attending" color="success" size="small" />
      case 'maybe':
        return <Chip icon={<MaybeIcon />} label="Maybe" color="warning" size="small" />
      case 'declined':
        return <Chip icon={<DeclinedIcon />} label="Declined" color="error" size="small" />
      case 'awaiting-response':
        return <Chip icon={<AwaitingIcon />} label="Awaiting Response" color="default" size="small" />
      default:
        return null
    }
  }

  // Handle opening the menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, userId: string) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedUserId(userId)
  }

  // Handle closing the menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setSelectedUserId(null)
  }

  // Handle updating user status
  const handleUpdateStatus = async (status: 'attending' | 'maybe' | 'declined' | 'awaiting-response') => {
    if (!selectedUserId) return

    try {
      await updateUserRSVP({
        eventId,
        userId: selectedUserId,
        status,
      }).unwrap()
      handleMenuClose()
    } catch (error) {
      console.error('Failed to update RSVP status:', error)
    }
  }

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Handle adding non-registered attendee
  const handleAddAttendeeDialogOpen = () => {
    setNonRegisteredAttendeeForm({
      firstName: '',
      lastName: '',
      email: '',
    })
    setAddAttendeeDialogOpen(true)
  }

  const handleAddAttendeeDialogClose = () => {
    setAddAttendeeDialogOpen(false)
  }

  const handleAddAttendeeFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNonRegisteredAttendeeForm({
      ...nonRegisteredAttendeeForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleAddAttendeeSubmit = async () => {
    try {
      await addNonRegisteredAttendee({
        eventId,
        attendee: {
          firstName: nonRegisteredAttendeeForm.firstName,
          lastName: nonRegisteredAttendeeForm.lastName,
          email: nonRegisteredAttendeeForm.email.trim() || undefined,
        },
      }).unwrap()
      handleAddAttendeeDialogClose()
    } catch (error) {
      console.error('Failed to add non-registered attendee:', error)
    }
  }

  // Handle editing non-registered attendee
  const handleEditAttendeeDialogOpen = (attendee: NonRegisteredAttendee) => {
    setNonRegisteredAttendeeForm({
      firstName: attendee.firstName,
      lastName: attendee.lastName,
      email: attendee.email || '',
    })
    setEditingAttendeeId(attendee.id)
    setEditAttendeeDialogOpen(true)
  }

  const handleEditAttendeeDialogClose = () => {
    setEditAttendeeDialogOpen(false)
    setEditingAttendeeId(null)
  }

  const handleEditAttendeeSubmit = async () => {
    if (!editingAttendeeId) return

    try {
      await updateNonRegisteredAttendee({
        eventId,
        attendeeId: editingAttendeeId,
        attendee: {
          firstName: nonRegisteredAttendeeForm.firstName,
          lastName: nonRegisteredAttendeeForm.lastName,
          email: nonRegisteredAttendeeForm.email.trim() || undefined,
        },
      }).unwrap()
      handleEditAttendeeDialogClose()
    } catch (error) {
      console.error('Failed to update non-registered attendee:', error)
    }
  }

  // Handle deleting non-registered attendee
  const handleDeleteAttendee = async (attendeeId: string) => {
    if (window.confirm('Are you sure you want to remove this attendee?')) {
      try {
        await deleteNonRegisteredAttendee({
          eventId,
          attendeeId,
        }).unwrap()
      } catch (error) {
        console.error('Failed to delete non-registered attendee:', error)
      }
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Attendance Summary
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<AttendingIcon />} label={`Attending: ${summary.attending}`} color="success" variant="outlined" />
          <Chip icon={<MaybeIcon />} label={`Maybe: ${summary.maybe}`} color="warning" variant="outlined" />
          <Chip icon={<DeclinedIcon />} label={`Declined: ${summary.declined}`} color="error" variant="outlined" />
          <Chip icon={<AwaitingIcon />} label={`Awaiting: ${summary.awaiting}`} color="default" variant="outlined" />
          <Chip label={`Total: ${summary.total}`} color="primary" variant="outlined" />
          {nonRegisteredAttendees.length > 0 && (
            <Chip
              icon={<PersonAddIcon />}
              label={`Walk-ins: ${summary.nonRegistered}`}
              color="secondary"
              variant="outlined"
            />
          )}
          <Chip
            label={`Total Attending: ${summary.totalAttending}`}
            color="success"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label="Registered Attendees" data-testid="tab-registered-attendees" />
        <Tab
          label={`Walk-in Attendees (${nonRegisteredAttendees.length})`}
          data-testid="tab-non-registered-attendees"
        />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
                data-testid="status-filter-select">
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="attending">Attending</MenuItem>
                <MenuItem value="maybe">Maybe</MenuItem>
                <MenuItem value="declined">Declined</MenuItem>
                <MenuItem value="awaiting-response">Awaiting Response</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell align="right">Status</TableCell>
                  {canManageAttendance && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRSVPs.length > 0 ? (
                  filteredRSVPs.map((rsvp) => (
                    <TableRow key={rsvp.userId}>
                      <TableCell>
                        {rsvp.firstName} {rsvp.lastName}
                      </TableCell>
                      <TableCell align="right">{getStatusChip(rsvp.status)}</TableCell>
                      {canManageAttendance && (
                        <TableCell align="right">
                          <Tooltip title="Change attendance status">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, rsvp.userId)}
                              disabled={isUpdating && selectedUserId === rsvp.userId}
                              data-testid={`edit-status-${rsvp.userId}`}>
                              {isUpdating && selectedUserId === rsvp.userId ? (
                                <CircularProgress size={20} />
                              ) : (
                                <EditIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManageAttendance ? 3 : 2} align="center">
                      <Typography variant="body2" color="textSecondary">
                        {rsvps.length > 0 ? 'No results found' : 'No RSVPs yet'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {activeTab === 1 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            {canManageAttendance && (
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={handleAddAttendeeDialogOpen}
                data-testid="add-non-registered-attendee-button">
                Add Walk-in
              </Button>
            )}
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  {canManageAttendance && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingNonRegistered ? (
                  <TableRow>
                    <TableCell colSpan={canManageAttendance ? 3 : 2} align="center">
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : nonRegisteredAttendees.length > 0 ? (
                  nonRegisteredAttendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell>
                        {attendee.firstName} {attendee.lastName}
                      </TableCell>
                      <TableCell>{attendee.email || '-'}</TableCell>
                      {canManageAttendance && (
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Tooltip title="Edit attendee">
                              <IconButton
                                size="small"
                                onClick={() => handleEditAttendeeDialogOpen(attendee)}
                                data-testid={`edit-attendee-${attendee.id}`}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove attendee">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteAttendee(attendee.id)}
                                data-testid={`delete-attendee-${attendee.id}`}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManageAttendance ? 3 : 2} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No walk-in attendees yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Status Change Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        <MenuItem onClick={() => handleUpdateStatus('attending')} data-testid="menu-option-attending">
          <ListItemIcon>
            <AttendingIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Mark as Attending</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('maybe')} data-testid="menu-option-maybe">
          <ListItemIcon>
            <MaybeIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Mark as Maybe</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('declined')} data-testid="menu-option-declined">
          <ListItemIcon>
            <DeclinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Mark as Declined</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('awaiting-response')} data-testid="menu-option-awaiting">
          <ListItemIcon>
            <AwaitingIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset to Awaiting Response</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Non-Registered Attendee Dialog */}
      <Dialog open={addAttendeeDialogOpen} onClose={handleAddAttendeeDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Walk-in Attendee</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="firstName"
              label="First Name"
              value={nonRegisteredAttendeeForm.firstName}
              onChange={handleAddAttendeeFormChange}
              fullWidth
              required
              data-testid="add-attendee-first-name"
            />
            <TextField
              name="lastName"
              label="Last Name"
              value={nonRegisteredAttendeeForm.lastName}
              onChange={handleAddAttendeeFormChange}
              fullWidth
              required
              data-testid="add-attendee-last-name"
            />
            <TextField
              name="email"
              label="Email (Optional)"
              value={nonRegisteredAttendeeForm.email}
              onChange={handleAddAttendeeFormChange}
              fullWidth
              type="email"
              data-testid="add-attendee-email"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddAttendeeDialogClose} data-testid="add-attendee-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleAddAttendeeSubmit}
            color="primary"
            variant="contained"
            disabled={
              isAddingAttendee ||
              !nonRegisteredAttendeeForm.firstName.trim() ||
              !nonRegisteredAttendeeForm.lastName.trim()
            }
            data-testid="add-attendee-submit">
            {isAddingAttendee ? <CircularProgress size={24} /> : 'Add Attendee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Non-Registered Attendee Dialog */}
      <Dialog open={editAttendeeDialogOpen} onClose={handleEditAttendeeDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Walk-in Attendee</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="firstName"
              label="First Name"
              value={nonRegisteredAttendeeForm.firstName}
              onChange={handleAddAttendeeFormChange}
              fullWidth
              required
              data-testid="edit-attendee-first-name"
            />
            <TextField
              name="lastName"
              label="Last Name"
              value={nonRegisteredAttendeeForm.lastName}
              onChange={handleAddAttendeeFormChange}
              fullWidth
              required
              data-testid="edit-attendee-last-name"
            />
            <TextField
              name="email"
              label="Email (Optional)"
              value={nonRegisteredAttendeeForm.email}
              onChange={handleAddAttendeeFormChange}
              fullWidth
              type="email"
              data-testid="edit-attendee-email"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditAttendeeDialogClose} data-testid="edit-attendee-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleEditAttendeeSubmit}
            color="primary"
            variant="contained"
            disabled={
              isUpdatingAttendee ||
              !nonRegisteredAttendeeForm.firstName.trim() ||
              !nonRegisteredAttendeeForm.lastName.trim()
            }
            data-testid="edit-attendee-submit">
            {isUpdatingAttendee ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AttendanceList
