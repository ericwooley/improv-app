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
  useMediaQuery,
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
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { PageHeader, InfoItem, formatDate, formatTime } from '../components'
import TabPanel, { a11yProps } from '../components/TabPanel'
import {
  useGetEventQuery,
  useDeleteEventMutation,
  useGetCurrentUserRSVPQuery,
  useGetEventGamesQuery,
  useGetEventPlayerAssignmentsQuery,
  useGetUserGamePreferencesQuery,
  useGetNonRegisteredAttendeesQuery,
} from '../store/api/eventsApi'
import { isAdminRole } from '../constants/roles'
import { EventGamesManager } from '../components/events/EventGamesManager'
import GameRunner from '../components/games/GameRunner'
import { RootState } from '../store'
import AttendanceList from '../components/events/AttendanceList'
import RSVPModal from '../components/events/RSVPModal'
import { GameData, analyzeGameHealth, calculateOverallHealthScore } from '../utils/gameHealthUtils'
import { theme } from '../theme'
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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
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
      <PageHeader
        title={event.Title}
        subtitle="Event Details"
        actions={
          canManageEvent && (
            <IconButton onClick={handleMenuOpen} data-testid="event-details-actions-button">
              <MoreVertIcon />
            </IconButton>
          )
        }
      />

      {canManageEvent && (
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
          }}
          data-testid="event-details-actions-menu">
          <MenuItem onClick={handleEditEvent} data-testid="event-details-edit-action">
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Event</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDeleteEvent} disabled={isDeleting} data-testid="event-details-delete-action">
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete Event</ListItemText>
          </MenuItem>
        </Menu>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Event tabs"
          variant={isMobile ? 'scrollable' : 'fullWidth'}>
          <Tab label="Event Details" icon={<InfoIcon />} iconPosition="start" {...a11yProps(0, 'event')} />
          <Tab label="Games" icon={<GamesIcon />} iconPosition="start" {...a11yProps(1, 'event')} />
          <Tab label="Attendance" icon={<GroupIcon />} iconPosition="start" {...a11yProps(2, 'event')} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0} id="event">
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid
              size={{
                xs: 12,
                md: 8,
              }}>
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

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<EventIcon />}
                  sx={{ mb: 2 }}
                  onClick={handleRSVPClick}>
                  {currentRSVPStatus ? `Update RSVP (${currentRSVPStatus})` : 'RSVP to Event'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Only render Game Management tabs if user is MC or has management permissions */}
        {(isMC || canManageEvent) && (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={gameTabValue} onChange={handleGameTabChange} aria-label="Game management tabs">
                <Tab label="Game Runner" {...a11yProps(0, 'game-management')} />
                <Tab label={<HealthStatusTab eventId={eventId} />} {...a11yProps(1, 'game-health')} />
              </Tabs>
            </Box>

            <TabPanel value={gameTabValue} index={0} id="game-management">
              <GameRunner eventId={eventId} isMC={isMC} />
            </TabPanel>

            <TabPanel value={gameTabValue} index={1} id="game-health">
              <GameDataView eventId={eventId} />
            </TabPanel>
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

  // Add query for non-registered attendees
  const { data: nonRegisteredData, isLoading: isLoadingNonRegistered } = useGetNonRegisteredAttendeesQuery(
    eventId || '',
    {
      skip: !eventId,
    }
  )

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

  if (isLoadingGames || isLoadingEvent || isLoadingAssignments || isLoadingPreferences || isLoadingNonRegistered) {
    return (
      <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    )
  }

  // Get registered attendees from RSVPs
  const registeredAttendees = eventData?.data?.rsvps?.filter((rsvp) => rsvp.status === 'attending') || []

  // Convert non-registered attendees to compatible format with isWalkIn flag
  const walkInAttendees = (nonRegisteredData?.data || []).map((attendee) => ({
    userId: attendee.id,
    firstName: attendee.firstName,
    lastName: attendee.lastName,
    status: 'attending' as const, // Explicitly type as "attending"
    isWalkIn: true,
  }))

  // Combine both types of attendees
  const allAttendees = [...registeredAttendees, ...walkInAttendees]

  const data: GameData = {
    games: gamesData?.data?.games || [],
    players: allAttendees,
    assignments: assignmentsData?.data || [],
    preferences: preferencesData?.data || [],
  }

  // Show GameHealthAnalyzer component with game data
  return (
    <Box>
      <GameHealthAnalyzer gameData={data} />
    </Box>
  )
}

// Component that displays health tab with icons based on health score
const HealthStatusTab = ({ eventId }: { eventId?: string }) => {
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data needed to calculate health score
  const { data: gamesData } = useGetEventGamesQuery(eventId || '', { skip: !eventId })
  const { data: eventData } = useGetEventQuery(eventId || '', { skip: !eventId })
  const { data: assignmentsData } = useGetEventPlayerAssignmentsQuery(eventId || '', { skip: !eventId })
  const { data: nonRegisteredData } = useGetNonRegisteredAttendeesQuery(eventId || '', { skip: !eventId })

  const gameIds = gamesData?.data?.games?.map((game) => game.id) || []
  const { data: preferencesData } = useGetUserGamePreferencesQuery(
    { eventId: eventId || '', gameIds },
    { skip: !eventId || gameIds.length === 0 }
  )

  // Calculate health score when data is available
  useEffect(() => {
    if (gamesData && eventData && assignmentsData && preferencesData && nonRegisteredData) {
      // Get registered attendees
      const registeredAttendees = eventData.data?.rsvps?.filter((rsvp) => rsvp.status === 'attending') || []

      // Convert non-registered attendees with isWalkIn flag
      const walkInAttendees = (nonRegisteredData.data || []).map((attendee) => ({
        userId: attendee.id,
        firstName: attendee.firstName,
        lastName: attendee.lastName,
        status: 'attending' as const,
        isWalkIn: true,
      }))

      // Combine both types of attendees
      const allAttendees = [...registeredAttendees, ...walkInAttendees]

      const data = {
        games: gamesData.data?.games || [],
        players: allAttendees,
        assignments: assignmentsData.data || [],
        preferences: preferencesData.data || [],
      }

      if (data.games.length > 0 && data.players.length > 0) {
        const playerProblems = analyzeGameHealth(data)
        const score = calculateOverallHealthScore(playerProblems)
        setHealthScore(score)
      }
      setIsLoading(false)
    }
  }, [gamesData, eventData, assignmentsData, preferencesData, nonRegisteredData])

  const getStatusIcon = () => {
    if (healthScore === null) return null

    if (healthScore < 50) {
      // Critical status - double error icon
      return (
        <Box sx={{ display: 'flex' }}>
          <ErrorIcon fontSize="small" color="error" />
          <ErrorIcon fontSize="small" color="error" sx={{ ml: -0.5 }} />
        </Box>
      )
    }

    if (healthScore < 60) {
      // Danger status
      return <ErrorIcon fontSize="small" color="error" />
    }

    if (healthScore < 70) {
      // High warning status - warning with red color
      return <WarningIcon fontSize="small" sx={{ color: '#ff8c00' }} />
    }

    if (healthScore < 80) {
      // Warning status
      return <WarningIcon fontSize="small" color="warning" />
    }

    if (healthScore < 90) {
      // Notice status
      return <InfoIcon fontSize="small" color="info" />
    }

    // Good status - above 90
    return <CheckCircleIcon fontSize="small" color="success" sx={{ opacity: 0.8 }} />
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      Game Health
      {!isLoading && <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>{getStatusIcon()}</Box>}
    </Box>
  )
}

export default EventDetailsPage
