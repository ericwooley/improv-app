import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateGameMutation } from '../store/api/gamesApi'
import { PageHeader, Breadcrumb } from '../components'
import { Box, Card, CardContent, TextField, Button, Stack, Alert, CircularProgress } from '@mui/material'

const NewGamePage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const [createGame, { isLoading, error }] = useCreateGameMutation()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minPlayers: 2,
    maxPlayers: 8,
    groupId: groupId || '',
    tags: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGame(formData).unwrap()
      navigate(`/groups/${groupId}`)
    } catch (err) {
      console.error('Failed to create game:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }))
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          { label: 'Create Game', active: true },
        ]}
      />

      <PageHeader title="Create New Game" subtitle="Add a new game to your group's library" />

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error">{error instanceof Error ? error.message : 'Failed to create game'}</Alert>
              )}

              <TextField
                required
                label="Game Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                required
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  required
                  label="Minimum Players"
                  name="minPlayers"
                  type="number"
                  value={formData.minPlayers}
                  onChange={handleChange}
                  inputProps={{ min: 1 }}
                />

                <TextField
                  required
                  label="Maximum Players"
                  name="maxPlayers"
                  type="number"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  inputProps={{ min: formData.minPlayers }}
                />
              </Box>

              <TextField
                label="Tags (comma-separated)"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                helperText="Enter tags separated by commas (e.g., warmup, short-form, long-form)"
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate(`/groups/${groupId}`)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}>
                  Create Game
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

export default NewGamePage
