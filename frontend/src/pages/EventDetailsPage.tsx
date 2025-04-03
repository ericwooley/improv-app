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
  Link as MuiLink,
} from '@mui/material'
import {
  Event as EventIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Mic as MicIcon,
} from '@mui/icons-material'
import { PageHeader, Breadcrumb, InfoItem, formatDate, formatTime } from '../components'
import { useGetEventQuery, useDeleteEventMutation } from '../store/api/eventsApi'
import { isAdminRole } from '../constants/roles'

// Helper function to create Google Maps link
const createGoogleMapsLink = (location: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

const EventDetailsPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [canManageEvent, setCanManageEvent] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

  const { data: eventResponse, isLoading, error } = useGetEventQuery(eventId || '')

  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation()

  // Format event data from API response
  const { event, groupName } = eventResponse?.data || {}

  // Check if user has permissions to manage this event
  useEffect(() => {
    if (event?.GroupID) {
      const checkGroupPermissions = async () => {
        try {
          const response = await fetch(`/api/groups/${event.GroupID}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          const groupData = await response.json()
          const userRole = groupData.data?.userRole
          setCanManageEvent(isAdminRole(userRole))
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
  const startDate = new Date(event.StartTime)

  return (
    <Box>
      <Breadcrumb
        items={[
          { label: 'Events', to: '/events' },
          ...(groupName ? [{ label: groupName, to: `/groups/${event.GroupID}` }] : []),
          { label: event.Title, active: true },
        ]}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <PageHeader title={event.Title} subtitle="Event Details" />

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

            {event.Description && (
              <Typography paragraph sx={{ mb: 3 }}>
                {event.Description}
              </Typography>
            )}

            <Box sx={{ mb: 3 }}>
              <InfoItem icon={<LocationIcon />}>
                <Typography>
                  {event.Location ? (
                    <MuiLink href={createGoogleMapsLink(event.Location)} target="_blank" rel="noopener noreferrer">
                      {event.Location}
                    </MuiLink>
                  ) : (
                    'No location specified'
                  )}
                </Typography>
              </InfoItem>

              <InfoItem icon={<TimeIcon />}>
                <Typography>
                  {formatDate(startDate)}, {formatTime(startDate)}
                </Typography>
              </InfoItem>

              {groupName && (
                <InfoItem icon={<PeopleIcon />}>
                  <Typography>
                    Organized by <Link to={`/groups/${event.GroupID}`}>{groupName}</Link>
                  </Typography>
                </InfoItem>
              )}

              {eventResponse?.data?.mc && (
                <InfoItem icon={<MicIcon />}>
                  <Typography>
                    MC: {eventResponse.data.mc.firstName} {eventResponse.data.mc.lastName}
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
