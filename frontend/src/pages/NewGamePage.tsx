import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateGameMutation } from '../store/api/gamesApi'
import { PageHeader, Breadcrumb } from '../components'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
} from '@mui/material'

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
    tags: [] as string[],
    public: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert tags array to comma-separated string for API
      const payload = {
        ...formData,
        tags: formData.tags.join(','),
      }
      await createGame(payload).unwrap()
      navigate(`/groups/${groupId}`)
    } catch (err) {
      console.error('Failed to create game:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, checked } = e.target as HTMLInputElement
    setFormData((prev) => ({
      ...prev,
      [name as string]: name === 'public' ? checked : value,
    }))
  }

  const handleTagsChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    setFormData((prev) => ({
      ...prev,
      tags: newValue,
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

              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.tags}
                onChange={handleTagsChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => <Chip variant="outlined" label={option} {...getTagProps({ index })} />)
                }
                renderInput={(params) => (
                  <TextField {...params} label="Tags" helperText="Type a tag and press Enter to add it" fullWidth />
                )}
              />

              <FormControlLabel
                control={<Switch checked={formData.public} onChange={handleChange} name="public" color="primary" />}
                label={
                  <Box>
                    <Box component="span" sx={{ fontWeight: 'medium' }}>
                      {formData.public ? 'Public' : 'Private'}
                    </Box>
                    <Box
                      component="span"
                      sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                      {formData.public
                        ? 'Game will appear in search results for all users'
                        : 'Game will only be visible to your group members'}
                    </Box>
                  </Box>
                }
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
