import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { useParams } from 'react-router-dom'
import { GamesListWithFilters } from '../games/GamesListWithFilters'
import {
  useGetEventGamesQuery,
  useAddEventGameMutation,
  useRemoveEventGameMutation,
  useUpdateEventGameOrderMutation,
} from '../../store/api/eventsApi'

interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  orderIndex: number
}

interface EventGamesManagerProps {
  groupId: string
  isMC: boolean
}

export const EventGamesManager = ({ groupId, isMC }: EventGamesManagerProps) => {
  const { eventId } = useParams<{ eventId: string }>()
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  // API hooks
  const {
    data: eventGamesResponse,
    isLoading: isLoadingGames,
    refetch: refetchEventGames,
  } = useGetEventGamesQuery(eventId || '')

  const [addEventGame] = useAddEventGameMutation()
  const [removeEventGame] = useRemoveEventGameMutation()
  const [updateGameOrder] = useUpdateEventGameOrderMutation()

  // Event games from API
  const eventGames: Game[] = eventGamesResponse?.data?.games || []

  // Handle game selection from the GamesList component
  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId)
  }

  // Add selected game to event
  const handleAddGame = async () => {
    if (!selectedGameId || !eventId) return

    try {
      await addEventGame({
        eventId,
        gameId: selectedGameId,
      }).unwrap()
      setSelectedGameId(null)
      refetchEventGames()
    } catch (error) {
      console.error('Failed to add game to event:', error)
    }
  }

  // Remove game from event
  const handleRemoveGame = async (gameId: string) => {
    if (!eventId) return

    try {
      await removeEventGame({
        eventId,
        gameId,
      }).unwrap()
      refetchEventGames()
    } catch (error) {
      console.error('Failed to remove game from event:', error)
    }
  }

  // Move game up in order
  const handleMoveUp = async (game: Game, index: number) => {
    if (index === 0 || !eventId) return

    try {
      await updateGameOrder({
        eventId,
        gameId: game.id,
        newIndex: game.orderIndex - 1,
      }).unwrap()
      refetchEventGames()
    } catch (error) {
      console.error('Failed to update game order:', error)
    }
  }

  // Move game down in order
  const handleMoveDown = async (game: Game, index: number) => {
    if (index === eventGames.length - 1 || !eventId) return

    try {
      await updateGameOrder({
        eventId,
        gameId: game.id,
        newIndex: game.orderIndex + 1,
      }).unwrap()
      refetchEventGames()
    } catch (error) {
      console.error('Failed to update game order:', error)
    }
  }

  // Display a read-only list of games for non-MC users
  if (!isMC) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Games
        </Typography>

        <Box sx={{ mt: 2 }}>
          {isLoadingGames ? (
            <Typography>Loading games...</Typography>
          ) : eventGames.length === 0 ? (
            <Alert severity="info">No games added to this event yet.</Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" paragraph>
                These games will be played during the event in the order shown below.
              </Typography>
              <List>
                {eventGames.map((game: Game, index: number) => (
                  <Box key={game.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText primary={game.name} secondary={`${game.minPlayers}-${game.maxPlayers} players`} />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </>
          )}
        </Box>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Event Games Manager
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        As the MC for this event, you can manage which games will be played and their order.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        {/* Left side: Available games */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Group Library Games
          </Typography>
          <Box sx={{ height: '400px', overflow: 'auto', border: '1px solid #eee' }}>
            <GamesListWithFilters
              groupLibrary={groupId}
              onGameSelect={handleGameSelect}
              selectedGameId={selectedGameId}
            />
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!selectedGameId}
            onClick={handleAddGame}
            sx={{ mt: 2 }}>
            Add Selected Game
          </Button>
        </Box>

        {/* Right side: Selected games */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Event Game Lineup
          </Typography>
          <Box sx={{ height: '400px', overflow: 'auto', border: '1px solid #eee', p: 1 }}>
            {isLoadingGames ? (
              <Typography>Loading games...</Typography>
            ) : eventGames.length === 0 ? (
              <Alert severity="info">No games added to this event yet.</Alert>
            ) : (
              <List>
                {eventGames.map((game: Game, index: number) => (
                  <Box key={game.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText primary={game.name} secondary={`${game.minPlayers}-${game.maxPlayers} players`} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" disabled={index === 0} onClick={() => handleMoveUp(game, index)}>
                          <ArrowUpward />
                        </IconButton>
                        <IconButton
                          edge="end"
                          disabled={index === eventGames.length - 1}
                          onClick={() => handleMoveDown(game, index)}>
                          <ArrowDownward />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleRemoveGame(game.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}
