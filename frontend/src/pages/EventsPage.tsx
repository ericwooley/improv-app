import { PageHeader, EmptyState, InfoItem, formatDate, formatTime } from '../components'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Link as MuiLink,
} from '@mui/material'
import { Link } from 'react-router-dom'
import {
  People as PeopleIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as ClockIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { useGetEventsQuery, Event as ApiEvent } from '../store/api/eventsApi'

interface Event {
  id: string
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
  groupId: string
  groupName?: string
}

// Helper function to create Google Maps link
const createGoogleMapsLink = (location: string) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

const EventsPage = () => {
  const { data: eventsResponse, isLoading, error } = useGetEventsQuery()

  // Format events from API response
  const formatEvents = (events: ApiEvent[]): Event[] => {
    return events.map((event) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
    }))
  }

  // Get events from API response
  const events = eventsResponse?.data ? formatEvents(eventsResponse.data) : []

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading events. Please try again later.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader title="Improv Events" subtitle="View upcoming improv events" />
        <Button component={Link} to="/events/new" variant="contained" color="primary" startIcon={<AddIcon />}>
          Create Event
        </Button>
      </Box>

      {events.length > 0 ? (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid
              size={{
                xs: 12,
              }}
              key={event.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader title={event.title} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {event.description}
                  </Typography>

                  <InfoItem icon={<PeopleIcon />}>{event.groupName || 'No Group'}</InfoItem>

                  <InfoItem icon={<LocationIcon />}>
                    {event.location ? (
                      <MuiLink href={createGoogleMapsLink(event.location)} target="_blank" rel="noopener noreferrer">
                        {event.location}
                      </MuiLink>
                    ) : (
                      'No location specified'
                    )}
                  </InfoItem>

                  <InfoItem icon={<CalendarIcon />}>{formatDate(event.startTime)}</InfoItem>

                  <InfoItem icon={<ClockIcon />}>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </InfoItem>
                </CardContent>

                <CardActions>
                  <Button component={Link} to={`/events/${event.id}`} variant="outlined" color="primary" size="small">
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState
          message="No events have been scheduled yet."
          actionText="Create Event"
          actionLink="/events/new"
          actionIcon="fas fa-plus"
        />
      )}
    </Box>
  )
}

export default EventsPage
