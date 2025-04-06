import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Alert,
  IconButton,
  Card,
  CardContent,
  Collapse,
} from '@mui/material'
import { useState, useMemo } from 'react'
import {
  useGetEventGamesQuery,
  useGetEventQuery,
  useGetUserGamePreferencesQuery,
  useGetEventPlayerAssignmentsQuery,
  useAssignPlayerToGameMutation,
  useRemovePlayerFromGameMutation,
} from '../../store/api/eventsApi'
import {
  PersonAdd as AssignIcon,
  PersonRemove as RemoveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material'
import { RSVP, GamePreference, PlayerAssignment } from '../../store/api/eventsApi'

interface GameRunnerProps {
  eventId?: string
  isMC?: boolean
}

const GameRunner = ({ eventId, isMC = false }: GameRunnerProps) => {
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({})

  // Fetch event games
  const {
    data: gamesData,
    isLoading: isLoadingGames,
    error: gamesError,
  } = useGetEventGamesQuery(eventId || '', {
    skip: !eventId,
  })

  // Fetch event details to get RSVPs
  const {
    data: eventData,
    isLoading: isLoadingEvent,
    error: eventError,
  } = useGetEventQuery(eventId || '', {
    skip: !eventId,
  })

  // Fetch player assignments
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useGetEventPlayerAssignmentsQuery(eventId || '', {
    skip: !eventId,
  })

  // Get game IDs for preference fetching
  const gameIds = useMemo(() => {
    return gamesData?.data?.games?.map((game) => game.id) || []
  }, [gamesData])

  // Fetch game preferences
  const { data: preferencesData, isLoading: isLoadingPreferences } = useGetUserGamePreferencesQuery(
    {
      eventId: eventId || '',
      gameIds: gameIds,
    },
    {
      skip: !eventId || gameIds.length === 0,
    }
  )

  // Mutations for player assignments
  const [assignPlayerToGame, { isLoading: isAssigning }] = useAssignPlayerToGameMutation()
  const [removePlayerFromGame, { isLoading: isRemoving }] = useRemovePlayerFromGameMutation()

  // Get assignments for easier access
  const playerAssignments = useMemo<PlayerAssignment[]>(() => {
    return assignmentsData?.data || []
  }, [assignmentsData])

  // Get game preferences
  const gamePreferences = useMemo<GamePreference[]>(() => {
    return preferencesData?.data || []
  }, [preferencesData])

  // Get attending users
  const attendingUsers = useMemo(() => {
    if (!eventData?.data?.rsvps) return []
    return eventData.data.rsvps.filter((rsvp) => rsvp.status === 'attending')
  }, [eventData])

  // Get players assigned to a specific game
  const getPlayersForGame = (gameId: string) => {
    return playerAssignments.filter((assignment) => assignment.gameId === gameId)
  }

  // Get available players (attending but not assigned to the given game)
  const getAvailablePlayersForGame = (gameId: string) => {
    if (!attendingUsers.length) return []
    const assignedUserIds = playerAssignments
      .filter((assignment) => assignment.gameId === gameId)
      .map((assignment) => assignment.userId)

    return attendingUsers.filter((user) => !assignedUserIds.includes(user.userId))
  }

  // Get player preference for a specific game
  const getPlayerPreference = (userId: string, gameId: string) => {
    return gamePreferences.find((pref) => pref.userId === userId && pref.gameId === gameId)
  }

  // Handle assigning a player to a game
  const handleAssignPlayer = async (gameId: string, user: RSVP) => {
    if (!eventId) return

    try {
      await assignPlayerToGame({
        eventId,
        gameId,
        userId: user.userId,
      }).unwrap()
    } catch (error) {
      console.error('Failed to assign player:', error)
    }
  }

  // Handle removing a player from a game
  const handleRemovePlayer = async (gameId: string, userId: string) => {
    if (!eventId) return

    try {
      await removePlayerFromGame({
        eventId,
        gameId,
        userId,
      }).unwrap()
    } catch (error) {
      console.error('Failed to remove player:', error)
    }
  }

  // Toggle game expansion
  const toggleGameExpansion = (gameId: string) => {
    setExpandedGames((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }))
  }

  // Render loading state
  if (isLoadingGames || isLoadingEvent || isLoadingAssignments || isLoadingPreferences) {
    return (
      <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    )
  }

  // Render error state
  if (gamesError || eventError) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Alert severity="error">Error loading game runner data. Please try again.</Alert>
      </Paper>
    )
  }

  // No games available
  if (!gamesData?.data?.games?.length) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Game Assignments
        </Typography>
        <Alert severity="info">No games have been added to this event yet. Add games in the Games tab.</Alert>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Game Assignments
      </Typography>

      <Box>
        <Typography variant="body1" gutterBottom>
          Assign players to games for this event
        </Typography>

        {gamesData.data.games.map((game) => {
          const isExpanded = expandedGames[game.id] || false
          const assignedPlayers = getPlayersForGame(game.id)
          const availablePlayers = getAvailablePlayersForGame(game.id)

          return (
            <Card key={game.id} variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ pb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleGameExpansion(game.id)}>
                  <Box>
                    <Typography variant="h6">{game.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={`${assignedPlayers.length}/${game.minPlayers}-${game.maxPlayers} players`}
                        size="small"
                        color={
                          assignedPlayers.length < game.minPlayers
                            ? 'error'
                            : assignedPlayers.length > game.maxPlayers
                            ? 'warning'
                            : 'success'
                        }
                        variant="outlined"
                      />
                      {game.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))}
                    </Box>
                  </Box>
                  <IconButton size="small">{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                </Box>
              </CardContent>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <CardContent>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {game.description}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Assigned Players ({assignedPlayers.length})
                      </Typography>

                      {assignedPlayers.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          No players assigned. Assign players from the available list.
                        </Alert>
                      ) : (
                        <List
                          sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}>
                          {assignedPlayers.map((player) => {
                            const preference = getPlayerPreference(player.userId, game.id)
                            return (
                              <ListItem
                                key={player.userId}
                                secondaryAction={
                                  isMC && (
                                    <IconButton
                                      edge="end"
                                      onClick={() => handleRemovePlayer(game.id, player.userId)}
                                      disabled={isRemoving}>
                                      <RemoveIcon />
                                    </IconButton>
                                  )
                                }>
                                <ListItemText
                                  primary={player.name}
                                  secondary={
                                    preference ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {preference.status && (
                                          <Chip
                                            label={preference.status}
                                            size="small"
                                            color={preference.status === 'experienced' ? 'success' : 'default'}
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
                                    ) : (
                                      'No preference data'
                                    )
                                  }
                                />
                              </ListItem>
                            )
                          })}
                        </List>
                      )}
                    </Grid>

                    <Grid size={6}>
                      <Typography variant="subtitle1" gutterBottom>
                        Available Players ({availablePlayers.length})
                      </Typography>

                      {availablePlayers.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          No more players available to assign.
                        </Alert>
                      ) : (
                        <List
                          sx={{
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}>
                          {availablePlayers.map((user) => {
                            const preference = getPlayerPreference(user.userId, game.id)
                            return (
                              <ListItem
                                key={user.userId}
                                secondaryAction={
                                  isMC && (
                                    <IconButton
                                      edge="end"
                                      onClick={() => handleAssignPlayer(game.id, user)}
                                      disabled={isAssigning}>
                                      <AssignIcon />
                                    </IconButton>
                                  )
                                }>
                                <ListItemText
                                  primary={`${user.firstName} ${user.lastName}`}
                                  secondary={
                                    preference ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {preference.status && (
                                          <Chip
                                            label={preference.status}
                                            size="small"
                                            color={preference.status === 'experienced' ? 'success' : 'default'}
                                            sx={{ ml: 1 }}
                                          />
                                        )}
                                      </Box>
                                    ) : (
                                      'No preference data'
                                    )
                                  }
                                />
                              </ListItem>
                            )
                          })}
                        </List>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Collapse>
            </Card>
          )
        })}
      </Box>
    </Paper>
  )
}

export default GameRunner
