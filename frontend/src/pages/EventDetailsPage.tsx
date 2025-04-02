import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import { PageHeader, Breadcrumb, InfoItem, formatDate, formatTime } from '../components'
import { useGetEventQuery, useDeleteEventMutation, Event } from '../store/api/eventsApi'

const EventDetailsPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [canManageEvent, setCanManageEvent] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

  const { data: eventResponse, isLoading, error } = useGetEventQuery(eventId || '')

  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation()

  // Format event data from API response
  const event: Event | undefined = eventResponse?.data

  // Check if user has permissions to manage this event
  useEffect(() => {
    if (event?.groupId) {
      const checkGroupPermissions = async () => {
        try {
          const response = await fetch(`/api/groups/${event.groupId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          const groupData = await response.json()
          const userRole = groupData.data?.userRole
          setCanManageEvent(userRole === 'admin' || userRole === 'organizer')
        } catch (error) {
          console.error('Error checking group permissions:', error)
          setCanManageEvent(false)
        }
      }

      checkGroupPermissions()
    }
  }, [event])

  // Handle opening the menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  // Handle closing the menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  // Handle edit event button click
  const handleEditEvent = () => {
    handleMenuClose()
    navigate(`/events/${eventId}/edit`)
  }

  // Handle delete event button click
  const handleDeleteEvent = async () => {
    if (!eventId) return

    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId).unwrap()
        navigate('/events')
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    }

    handleMenuClose()
  }

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Show error state
  if (error || !event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => navigate('/events')}>
              Back to Events
            </Button>
          }>
          {error ? 'Error loading event. You may not have permission to view this event.' : 'Event not found.'}
        </Alert>
      </Box>
    )
  }

  // Format event dates
  const startDate = new Date(event.startTime)
  const endDate = new Date(event.endTime)

  return (
    <Box>
      <Breadcrumb
        items={[
          { label: 'Events', to: '/events' },
          ...(event.groupName ? [{ label: event.groupName, to: `/groups/${event.groupId}` }] : []),
          { label: event.title, active: true },
        ]}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <PageHeader title={event.title} subtitle="Event Details" />

        {canManageEvent && (
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>

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
              <MenuItem onClick={handleEditEvent}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Edit Event</ListItemText>
              </MenuItem>
              <MenuItem onClick={handleDeleteEvent} disabled={isDeleting}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Delete Event</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={8}>
            <Typography variant="h6" gutterBottom>
              Event Details
            </Typography>

            {event.description && (
              <Typography paragraph sx={{ mb: 3 }}>
                {event.description}
              </Typography>
            )}

            <Box sx={{ mb: 3 }}>
              <InfoItem icon={<LocationIcon />}>
                <Typography>{event.location}</Typography>
              </InfoItem>

              <InfoItem icon={<TimeIcon />}>
                <Typography>
                  {formatDate(startDate)}, {formatTime(startDate)} - {formatTime(endDate)}
                </Typography>
              </InfoItem>

              {event.groupName && (
                <InfoItem icon={<PeopleIcon />}>
                  <Typography>
                    Organized by <Link to={`/groups/${event.groupId}`}>{event.groupName}</Link>
                  </Typography>
                </InfoItem>
              )}
            </Box>
          </Grid>

          <Grid size={4}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>

              <Button variant="contained" color="primary" fullWidth startIcon={<EventIcon />} sx={{ mb: 2 }}>
                RSVP to Event
              </Button>

              {canManageEvent && (
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  component={Link}
                  to={`/events/${eventId}/edit`}
                  startIcon={<EditIcon />}>
                  Edit Event
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default EventDetailsPage
