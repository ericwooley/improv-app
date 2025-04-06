import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Box,
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
  Tabs,
  Tab,
  Paper,
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
  Info as InfoIcon,
  Games as GamesIcon,
  Group as GroupIcon,
} from '@mui/icons-material'
import { PageHeader, Breadcrumb, InfoItem, formatDate, formatTime } from '../components'
import TabPanel, { a11yProps } from '../components/TabPanel'
import {
  useGetEventQuery,
  useDeleteEventMutation,
  useGetCurrentUserRSVPQuery,
  useGetEventGamesQuery,
  useGetEventPlayerAssignmentsQuery,
  useGetUserGamePreferencesQuery,
} from '../store/api/eventsApi'
import { isAdminRole } from '../constants/roles'
import { EventGamesManager } from '../components/events/EventGamesManager'
import GameRunner from '../components/games/GameRunner'
import { RootState } from '../store'
import AttendanceList from '../components/events/AttendanceList'
import RSVPModal from '../components/events/RSVPModal'
import { GameData } from '../utils/gameHealthUtils'
import GameHealthAnalyzer from '../components/games/GameHealthAnalyzer'

// Helper function to create Google Maps link
const createGoogleMapsLink = (location: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

const EventDetailsPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [canManageEvent, setCanManageEvent] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [rsvpModalOpen, setRsvpModalOpen] = useState(false)

  // Initialize tab value from URL query parameter or default to 0
  const urlParams = new URLSearchParams(location.search)
  const initialTabValue = parseInt(urlParams.get('tab-event') || '0')
  const [tabValue, setTabValue] = useState(initialTabValue)

  // Initialize second level tabs for game management
  const initialGameTabValue = parseInt(urlParams.get('tab-game-management') || '0')
  const [gameTabValue, setGameTabValue] = useState(initialGameTabValue)

  // Get current user from Redux store
  const currentUser = useSelector((state: RootState) => state.auth.user)

  const { data: eventResponse, isLoading, error } = useGetEventQuery(eventId || '')
  const { data: currentUserRSVP } = useGetCurrentUserRSVPQuery(eventId || '', {
    skip: !eventId,
  })

  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation()

  // Format event data from API response
  const { event, groupName, mc, rsvps = [] } = eventResponse?.data || {}

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

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)

    // Update URL with tab value
    const newParams = new URLSearchParams(location.search)
    newParams.set('tab-event', newValue.toString())
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true })
  }

  // Handle game management tab change
  const handleGameTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setGameTabValue(newValue)

    // Update URL with tab value
    const newParams = new URLSearchParams(location.search)
    newParams.set('tab-game-management', newValue.toString())
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true })
  }

  // Handle RSVP button click
  const handleRSVPClick = () => {
    setRsvpModalOpen(true)
  }

  // Determine if current user is the MC
  const isMC = Boolean(mc && currentUser && mc.id === currentUser.id)

  // Get current user RSVP status
  const currentRSVPStatus = currentUserRSVP?.data?.status

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Event tabs" variant="fullWidth">
          <Tab label="Event Details" icon={<InfoIcon />} iconPosition="start" {...a11yProps(0, 'event')} />
          <Tab label="Games" icon={<GamesIcon />} iconPosition="start" {...a11yProps(1, 'event')} />
          <Tab label="Attendance" icon={<GroupIcon />} iconPosition="start" {...a11yProps(2, 'event')} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0} id="event">
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid size={8}>
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

                {mc && (
                  <InfoItem icon={<MicIcon />}>
                    <Typography>
                      MC: {mc.firstName} {mc.lastName}
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

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<EventIcon />}
                  sx={{ mb: 2 }}
                  onClick={handleRSVPClick}>
                  {currentRSVPStatus ? `Update RSVP (${currentRSVPStatus})` : 'RSVP to Event'}
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
        </Box>

        {/* Only render Game Management tabs if user is MC or has management permissions */}
        {(isMC || canManageEvent) && (
          <>
            <Paper sx={{ mt: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={gameTabValue} onChange={handleGameTabChange} aria-label="Game management tabs">
                  <Tab label="Game Runner" {...a11yProps(0, 'game-management')} />
                  <Tab label="Game Health" {...a11yProps(1, 'game-health')} />
                </Tabs>
              </Box>

              <TabPanel value={gameTabValue} index={0} id="game-management">
                <GameRunner eventId={eventId} isMC={isMC} />
              </TabPanel>

              <TabPanel value={gameTabValue} index={1} id="game-health">
                <GameDataView eventId={eventId} />
              </TabPanel>
            </Paper>
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1} id="event">
        <EventGamesManager groupId={event.GroupID} isMC={isMC} />
      </TabPanel>

      <TabPanel value={tabValue} index={2} id="event">
        <AttendanceList rsvps={rsvps} eventId={eventId || ''} canManageAttendance={canManageEvent} />
      </TabPanel>

      {/* RSVP Modal */}
      <RSVPModal
        open={rsvpModalOpen}
        onClose={() => setRsvpModalOpen(false)}
        eventId={eventId || ''}
        initialStatus={currentRSVPStatus}
      />
    </Box>
  )
}

// Component to display game data in JSON format and game health analysis
const GameDataView = ({ eventId }: { eventId?: string }) => {
  const { data: gamesData, isLoading: isLoadingGames } = useGetEventGamesQuery(eventId || '', { skip: !eventId })

  const { data: eventData, isLoading: isLoadingEvent } = useGetEventQuery(eventId || '', { skip: !eventId })

  const { data: assignmentsData, isLoading: isLoadingAssignments } = useGetEventPlayerAssignmentsQuery(eventId || '', {
    skip: !eventId,
  })

  const gameIds = gamesData?.data?.games?.map((game) => game.id) || []

  const { data: preferencesData, isLoading: isLoadingPreferences } = useGetUserGamePreferencesQuery(
    {
      eventId: eventId || '',
      gameIds: gameIds,
    },
    {
      skip: !eventId || gameIds.length === 0,
    }
  )

  if (isLoadingGames || isLoadingEvent || isLoadingAssignments || isLoadingPreferences) {
    return (
      <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    )
  }

  const data: GameData = {
    games: gamesData?.data?.games || [],
    players: eventData?.data?.rsvps?.filter((rsvp) => rsvp.status === 'attending') || [],
    assignments: assignmentsData?.data || [],
    preferences: preferencesData?.data || [],
  }

  // Show GameHealthAnalyzer component with game data
  return (
    <Box>
      <GameHealthAnalyzer gameData={data} />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Raw Game Data (JSON)
        </Typography>
        <Box
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            p: 2,
            backgroundColor: 'grey.100',
            borderRadius: 1,
            fontFamily: 'monospace',
          }}>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Box>
      </Paper>
    </Box>
  )
}

export default EventDetailsPage
