import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { useGetEventsQuery } from '../store/api/eventsApi'
import { useGetUnratedGamesQuery } from '../store/api/gamesApi'
import { Group } from '../store/api/groupsApi'
import { Event } from '../store/api/eventsApi'
import { Game } from '../store/api/gamesApi'
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
import { Event as EventIcon, Group as GroupIcon, Settings as SettingsIcon } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import Invitations from '../components/Invitations'
import { GroupsList } from '../components'
import GameCard from '../components/GameCard'
import { AnimatePresence } from 'framer-motion'
import { useState } from 'react'

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
  const { data: unratedGamesResponse, isLoading: unratedGamesLoading } = useGetUnratedGamesQuery()
  const [ratedGameIds, setRatedGameIds] = useState<Set<string>>(new Set())

  const groups = (groupsResponse as unknown as ApiResponse<Group[]>)?.data || []
  const events = (eventsResponse as unknown as ApiResponse<Event[]>)?.data || []
  const allUnratedGames = (unratedGamesResponse as unknown as ApiResponse<Game[]>)?.data || []

  // Filter out games that have been marked as rated by the user during this session
  const unratedGames = allUnratedGames.filter((game) => !ratedGameIds.has(game.id))

  const handleGameRated = (gameId: string) => {
    setRatedGameIds((prev) => new Set([...prev, gameId]))
  }

  // Only show section if there are still unrated games
  const showUnratedGamesSection = unratedGames.length > 0

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {isAuthenticated && user ? (
        <>
          <Typography variant="h4" sx={{ mb: 4 }}>
            Dashboard
          </Typography>

          {/* Invitations Component */}
          <Invitations />

          {/* Games Needing Status */}
          {showUnratedGamesSection && (
            <Grid size={12} sx={{ mb: 3 }}>
              <Card>
                <CardHeader
                  title="Games Needing Your Preferences"
                  action={
                    <Button component={Link} to="/games" variant="outlined" startIcon={<SettingsIcon />}>
                      View All Games
                    </Button>
                  }
                />
                <CardContent>
                  {unratedGamesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Grid container spacing={2} data-unrated-games-list="true">
                      <AnimatePresence>
                        {unratedGames.slice(0, 5).map((game) => (
                          <Grid
                            key={game.id}
                            size={{
                              xs: 12,
                            }}>
                            <GameCard game={game} onClick={() => handleGameRated(game.id)} />
                          </Grid>
                        ))}
                      </AnimatePresence>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

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
                  <GroupsList groups={groups} isLoading={groupsLoading} maxItems={5} />
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
