import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetGameQuery, useUpdateGameMutation } from '../store/api/gamesApi'
import { PageHeader, Breadcrumb, GameForm } from '../components'
import { Box, Card, CardContent, CircularProgress, Alert } from '@mui/material'
import { GameFormData } from '../components/games/GameForm'

const EditGamePage = () => {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()

  const { data: gameData, isLoading: gameLoading, error: gameError } = useGetGameQuery(gameId || '')
  const [updateGame, { isLoading: updateLoading, error: updateError }] = useUpdateGameMutation()

  const [initialData, setInitialData] = useState<GameFormData | null>(null)

  useEffect(() => {
    if (gameData?.data?.game) {
      const game = gameData.data.game
      setInitialData({
        name: game.name || '',
        description: game.description || '',
        minPlayers: game.minPlayers || 2,
        maxPlayers: game.maxPlayers || 8,
        groupId: game.groupId || '',
        tags: game.tags || [],
        public: game.public || false,
      })
    }
  }, [gameData])

  const handleSubmit = async (formData: GameFormData) => {
    if (!gameId) return

    try {
      await updateGame({
        id: gameId,
        name: formData.name,
        description: formData.description,
        minPlayers: formData.minPlayers,
        maxPlayers: formData.maxPlayers,
        public: formData.public,
        tags: formData.tags,
      }).unwrap()

      navigate(`/games/${gameId}`)
    } catch (err) {
      console.error('Failed to update game:', err)
    }
  }

  if (gameLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (gameError || !initialData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading game details. You may not have permission to edit this game.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb
        items={[
          { label: 'Games', to: '/games' },
          { label: initialData.name, to: `/games/${gameId}` },
          { label: 'Edit', active: true },
        ]}
      />

      <PageHeader title="Edit Game" subtitle="Update game details" />

      <Card>
        <CardContent>
          <GameForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={updateLoading}
            error={updateError}
            submitButtonText="Update Game"
            cancelUrl={`/games/${gameId}`}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

export default EditGamePage
