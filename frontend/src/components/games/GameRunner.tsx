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
  Slide,
  Button,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  AutoFixHigh as OptimizeIcon,
} from '@mui/icons-material'
import { RSVP, GamePreference, PlayerAssignment } from '../../store/api/eventsApi'
import { GameData, autoAssignPlayers } from '../../utils/gameHealthUtils'

interface GameRunnerProps {
  eventId?: string
  isMC?: boolean
}

// Add this function before the GameRunner component
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'I Love playing this':
      return 'success'
    case 'I Need to practice this':
      return 'warning'
    case 'I dont like this game':
      return 'error'
    case 'I want to try this game':
      return 'info'
    case 'No opinion on this game':
      return 'default'
    default:
      return 'default'
  }
}

const GameRunner = ({ eventId, isMC = false }: GameRunnerProps) => {
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({})
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizeResult, setOptimizeResult] = useState<{
    open: boolean
    message: string
  }>({
    open: false,
    message: '',
  })
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

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

  // Show confirmation dialog
  const handleShowConfirmDialog = () => {
    setConfirmDialogOpen(true)
  }

  // Close confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false)
  }

  // Handle auto-optimization of player assignments
  const handleAutoOptimize = async () => {
    if (!eventId || !gamesData?.data?.games || !eventData?.data?.rsvps) return

    // Close the confirmation dialog
    setConfirmDialogOpen(false)
    setIsOptimizing(true)

    try {
      // Create GameData object for optimization
      const gameData: GameData = {
        games: gamesData?.data?.games || [],
        players: eventData?.data?.rsvps?.filter((rsvp) => rsvp.status === 'attending') || [],
        assignments: playerAssignments,
        preferences: gamePreferences,
      }

      // Get optimized assignments
      const optimizedAssignments = autoAssignPlayers(gameData)

      // Determine assignments to add and remove
      const assignmentsToRemove: { userId: string; gameId: string }[] = []
      const assignmentsToAdd: { userId: string; gameId: string }[] = []

      // Find assignments to remove (in current but not in optimized)
      playerAssignments.forEach((current) => {
        const stillExists = optimizedAssignments.some(
          (opt) => opt.userId === current.userId && opt.gameId === current.gameId
        )

        if (!stillExists) {
          assignmentsToRemove.push({
            userId: current.userId,
            gameId: current.gameId,
          })
        }
      })

      // Find assignments to add (in optimized but not in current)
      optimizedAssignments.forEach((optimized) => {
        const alreadyExists = playerAssignments.some(
          (current) => current.userId === optimized.userId && current.gameId === optimized.gameId
        )

        if (!alreadyExists) {
          assignmentsToAdd.push({
            userId: optimized.userId,
            gameId: optimized.gameId,
          })
        }
      })

      // Process removals first
      for (const assignment of assignmentsToRemove) {
        await removePlayerFromGame({
          eventId,
          gameId: assignment.gameId,
          userId: assignment.userId,
        }).unwrap()
      }

      // Then process additions
      for (const assignment of assignmentsToAdd) {
        await assignPlayerToGame({
          eventId,
          gameId: assignment.gameId,
          userId: assignment.userId,
        }).unwrap()
      }

      // Show success notification
      setOptimizeResult({
        open: true,
        message: `Optimization complete! Removed ${assignmentsToRemove.length} and added ${assignmentsToAdd.length} assignments.`,
      })

      // Log results
      console.log(
        `Auto-optimization complete. Removed ${assignmentsToRemove.length} assignments and added ${assignmentsToAdd.length} assignments.`
      )
    } catch (error) {
      console.error('Failed to auto-optimize assignments:', error)
      setOptimizeResult({
        open: true,
        message: 'Failed to optimize assignments. Please try again.',
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  // Handle closing the notification
  const handleCloseNotification = () => {
    setOptimizeResult({
      ...optimizeResult,
      open: false,
    })
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Game Assignments</Typography>

        {isMC && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<OptimizeIcon />}
            onClick={handleShowConfirmDialog}
            disabled={isOptimizing}>
            {isOptimizing ? 'Optimizing...' : 'Auto-Optimize Assignments'}
          </Button>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirm Auto-Optimization</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will automatically optimize player assignments to games based on player preferences and game
            requirements. Existing assignments may be removed and new ones added. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAutoOptimize} color="secondary" variant="contained">
            Optimize Assignments
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification for optimization results */}
      <Snackbar
        open={optimizeResult.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={optimizeResult.message}
      />

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
                              <Slide
                                key={player.userId}
                                direction="right"
                                in={true}
                                mountOnEnter
                                unmountOnExit
                                timeout={300}>
                                <ListItem
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
                                              variant="outlined"
                                              color={getStatusVariant(preference.status)}
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
                              </Slide>
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
                              <Slide
                                key={user.userId}
                                direction="left"
                                in={true}
                                mountOnEnter
                                unmountOnExit
                                timeout={300}>
                                <ListItem
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
                                              variant="outlined"
                                              color={getStatusVariant(preference.status)}
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
                              </Slide>
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
