import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateGameMutation } from '../store/api/gamesApi'
import { PageHeader, GameForm } from '../components'
import { Box, Card, CardContent } from '@mui/material'
import { GameFormData } from '../components/games/GameForm'

const NewGamePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')

  const [createGame, { isLoading, error }] = useCreateGameMutation()

  const [initialData] = useState<GameFormData>({
    name: '',
    description: '',
    minPlayers: 2,
    maxPlayers: 8,
    groupId: groupId || '',
    tags: [],
    public: true,
  })

  const handleSubmit = async (formData: GameFormData) => {
    try {
      const payload = {
        ...formData,
        tags: formData.tags.join(','),
      }
      const result = await createGame(payload).unwrap()
      navigate(`/games/${result.data.id}`)
    } catch (err) {
      console.error('Failed to create game:', err)
    }
  }

  return (
    <Box data-testid="new-game-page">
      <PageHeader title="Create New Game" subtitle="Add a new game to your group's library" />

      <Card data-testid="new-game-page-form-card">
        <CardContent>
          <GameForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            submitButtonText="Create Game"
            cancelUrl={`/groups/${groupId}`}
          />
        </CardContent>
      </Card>
    </Box>
  )
}

export default NewGamePage
