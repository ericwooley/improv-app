import { useState } from 'react'
import { Box, Typography, Paper, Button, IconButton, Grid, Alert } from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { useParams } from 'react-router-dom'
import { GamesList } from '../games/GamesList'
import GameCard from '../GameCard'
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
  const [selectedTag, setSelectedTag] = useState<string>('All Tags')

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

  // Handle tag selection clear
  const handleClearFilter = () => {
    setSelectedTag('All Tags')
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

  // Render event games list
  const renderEventGamesList = () => {
    if (isLoadingGames) {
      return <Typography>Loading games...</Typography>
    }

    if (eventGames.length === 0) {
      return <Alert severity="info">No games added to this event yet.</Alert>
    }

    return (
      <Grid container spacing={2}>
        {eventGames.map((game, index) => (
          <Grid size={12} key={game.id}>
            <Box sx={{ position: 'relative' }}>
              <GameCard game={game} showViewButton={true} />
              {isMC && (
                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                  <IconButton
                    size="small"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(game, index)}
                    sx={{ bgcolor: 'background.paper' }}>
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={index === eventGames.length - 1}
                    onClick={() => handleMoveDown(game, index)}
                    sx={{ bgcolor: 'background.paper' }}>
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveGame(game.id)}
                    sx={{ bgcolor: 'background.paper' }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isMC ? 'Event Games Manager' : 'Event Games'}
      </Typography>

      {isMC ? (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            As the MC for this event, you can manage which games will be played and their order.
          </Typography>

          <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
            {/* Left side: Available games */}
            <Paper
              elevation={2}
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
              }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Group Library Games
              </Typography>
              <Box sx={{ height: '400px', overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                <GamesList
                  selectedTag={selectedTag}
                  onClearFilter={handleClearFilter}
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
            </Paper>

            {/* Right side: Games list */}
            <Paper
              elevation={2}
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.default',
              }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Event Game Lineup
              </Typography>
              {renderEventGamesList()}
            </Paper>
          </Box>
        </>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            These games will be played during the event in the order shown below.
          </Typography>
          {renderEventGamesList()}
        </>
      )}
    </Paper>
  )
}
