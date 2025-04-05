import React from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { GroupEvent } from '../../store/api/eventsApi'
import { isAdminRole } from '../../constants/roles'

interface GroupEventsTabProps {
  groupId: string
  userRole: string
  events: GroupEvent[]
  isLoading: boolean
}

const GroupEventsTab: React.FC<GroupEventsTabProps> = ({ groupId, userRole, events, isLoading }) => {
  const isAdmin = isAdminRole(userRole)

  // Filter upcoming events (those with start time in the future)
  const upcomingEvents = events
    .filter((event) => {
      return new Date(event.StartTime) > new Date()
    })
    .sort((a, b) => {
      // Sort by start time (earliest first)
      return new Date(a.StartTime).getTime() - new Date(b.StartTime).getTime()
    })

  // Filter past events (those with start time in the past)
  const pastEvents = events
    .filter((event) => {
      return new Date(event.StartTime) <= new Date()
    })
    .sort((a, b) => {
      // Sort by start time (most recent first)
      return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime()
    })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('MMM D, YYYY • h:mm A')
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Upcoming Events</Typography>
            {isAdmin && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={Link}
                to={`/events/new?groupId=${groupId}`}>
                Create Event
              </Button>
            )}
          </Box>

          {upcomingEvents.length === 0 ? (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Alert severity="info">
                  No upcoming events scheduled. {isAdmin && 'Click the "Create Event" button to schedule one!'}
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <List>
              {upcomingEvents.map((event) => (
                <React.Fragment key={event.ID}>
                  <ListItem
                    component={Link}
                    to={`/events/${event.ID}`}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      textDecoration: 'none',
                      color: 'text.primary',
                      '&:hover': { bgcolor: 'action.hover' },
                      p: 2,
                    }}>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.StartTime)}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <EventIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">{event.Title}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box display="flex" alignItems="center">
                            <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{event.Location}</Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Chip
                      label="Details"
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Grid>

        {pastEvents.length > 0 && (
          <Grid size={12} sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Past Events
            </Typography>
            <List>
              {pastEvents.slice(0, 5).map((event) => (
                <React.Fragment key={event.ID}>
                  <ListItem
                    component={Link}
                    to={`/events/${event.ID}`}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      textDecoration: 'none',
                      color: 'text.secondary',
                      '&:hover': { bgcolor: 'action.hover' },
                      p: 2,
                    }}>
                    <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon color="disabled" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(event.StartTime)}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <EventIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="subtitle1">{event.Title}</Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box display="flex" alignItems="center">
                            <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">{event.Location}</Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Chip
                      label="View"
                      color="default"
                      variant="outlined"
                      size="small"
                      sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
              {pastEvents.length > 5 && (
                <ListItem
                  component={Link}
                  to={`/groups/${groupId}/events`}
                  sx={{
                    justifyContent: 'center',
                    textDecoration: 'none',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}>
                  <Typography color="primary" variant="button">
                    View All Past Events
                  </Typography>
                </ListItem>
              )}
            </List>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default GroupEventsTab
