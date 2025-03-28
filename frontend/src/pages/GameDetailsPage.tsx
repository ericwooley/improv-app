import { Box, CircularProgress, Button, Alert } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader, Breadcrumb } from '../components'
import GameCard from '../components/GameCard'
import { useGetGameQuery } from '../store/api/gamesApi'

const GameDetailsPage = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { data: gameData, isLoading, error } = useGetGameQuery(gameId || '')

  // Extract data from response
  const game = gameData?.data?.game

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          This game is not available. You may not have permission to view it if it's not public or you're not a member
          of the group that owns it.
        </Alert>
        <Button variant="contained" color="primary" onClick={() => navigate('/games')}>
          Back to Games
        </Button>
      </Box>
    )
  }

  if (!game) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="warning">Game not found.</Alert>
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/games')}>
          Back to Games
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Breadcrumb
        items={[
          { label: 'Games', to: '/games' },
          { label: game.name || 'Game Details', active: true },
        ]}
      />

      <PageHeader title="Game Details" subtitle="" />

      <GameCard game={game} showViewButton={false} />
    </Box>
  )
}

export default GameDetailsPage
