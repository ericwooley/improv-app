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
} from '@mui/material'
import {
  CheckCircle as AttendingIcon,
  HelpOutline as MaybeIcon,
  Cancel as DeclinedIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { RSVP } from '../../store/api/eventsApi'
import { useUpdateUserRSVPMutation } from '../../store/api/eventsApi'

interface AttendanceListProps {
  rsvps: RSVP[]
  eventId: string
  canManageAttendance: boolean
}

const AttendanceList = ({ rsvps, eventId, canManageAttendance }: AttendanceListProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const [updateUserRSVP, { isLoading: isUpdating }] = useUpdateUserRSVPMutation()

  // Count summary
  const summary = useMemo(() => {
    return {
      attending: rsvps.filter((rsvp) => rsvp.status === 'attending').length,
      maybe: rsvps.filter((rsvp) => rsvp.status === 'maybe').length,
      declined: rsvps.filter((rsvp) => rsvp.status === 'declined').length,
      total: rsvps.length,
    }
  }, [rsvps])

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
  const handleUpdateStatus = async (status: 'attending' | 'maybe' | 'declined') => {
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
          <Chip label={`Total: ${summary.total}`} color="primary" variant="outlined" />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status">
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="attending">Attending</MenuItem>
            <MenuItem value="maybe">Maybe</MenuItem>
            <MenuItem value="declined">Declined</MenuItem>
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
                          disabled={isUpdating && selectedUserId === rsvp.userId}>
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
        <MenuItem onClick={() => handleUpdateStatus('attending')}>
          <ListItemIcon>
            <AttendingIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Mark as Attending</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('maybe')}>
          <ListItemIcon>
            <MaybeIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Mark as Maybe</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUpdateStatus('declined')}>
          <ListItemIcon>
            <DeclinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Mark as Declined</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default AttendanceList
