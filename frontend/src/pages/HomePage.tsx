import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { useGetEventsQuery } from '../store/api/eventsApi'
import { Group } from '../store/api/groupsApi'
import { Event } from '../store/api/eventsApi'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
} from '@mui/material'
import { Group as GroupIcon, Event as EventIcon } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import Invitations from '../components/Invitations'

// Define API response structure
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
}

const HomePage = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { data: groupsResponse, isLoading: groupsLoading } = useGetGroupsQuery()
  const { data: eventsResponse, isLoading: eventsLoading } = useGetEventsQuery()

  const groups = (groupsResponse as unknown as ApiResponse<Group[]>)?.data || []
  const events = (eventsResponse as unknown as ApiResponse<Event[]>)?.data || []

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {isAuthenticated && user ? (
        <>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Dashboard
          </Typography>

          {/* Invitations Component */}
          <Invitations />

          <Grid container spacing={3}>
            {/* Recent Groups */}
            <Grid size={12}>
              <Card>
                <CardHeader
                  title="Recent Groups"
                  action={
                    <Button component={Link} to="/groups" variant="outlined" startIcon={<GroupIcon />}>
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  {groupsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : groups.length > 0 ? (
                    <List>
                      {groups.slice(0, 5).map((group: Group) => (
                        <ListItemButton key={group.ID} component={Link} to={`/groups/${group.ID}`}>
                          <ListItemIcon>
                            <GroupIcon />
                          </ListItemIcon>
                          <ListItemText primary={group.Name} secondary={group.Description} />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">
                      No groups found. Create your first group to get started!
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Events */}
            <Grid size={12}>
              <Card>
                <CardHeader
                  title="Upcoming Events"
                  action={
                    <Button component={Link} to="/events" variant="outlined" startIcon={<EventIcon />}>
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  {eventsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : events.length > 0 ? (
                    <List>
                      {events.slice(0, 5).map((event: Event) => (
                        <ListItemButton key={event.id} component={Link} to={`/events/${event.id}`}>
                          <ListItemIcon>
                            <EventIcon />
                          </ListItemIcon>
                          <ListItemText primary={event.title} secondary={event.description} />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">No upcoming events. Create an event to get started!</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Welcome to ImprovHQ
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 4 }}>
            Sign in or create an account to get started
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button component={Link} to="/login" variant="contained" size="large">
              Sign In
            </Button>
            <Button component={Link} to="/register" variant="outlined" size="large">
              Create Account
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default HomePage
