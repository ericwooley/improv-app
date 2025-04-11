import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetchAllowedTagsQuery } from '../../store/api/gamesApi'
import {
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  Box,
} from '@mui/material'

export interface GameFormData {
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  groupId: string
  tags: string[]
  public: boolean
}

interface GameFormProps {
  initialData?: GameFormData
  onSubmit: (formData: GameFormData) => Promise<void>
  isLoading: boolean
  error: unknown
  submitButtonText: string
  cancelUrl: string
}

const GameForm = ({
  initialData = {
    name: '',
    description: '',
    minPlayers: 2,
    maxPlayers: 8,
    groupId: '',
    tags: [],
    public: true,
  },
  onSubmit,
  isLoading,
  error,
  submitButtonText,
  cancelUrl,
}: GameFormProps) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<GameFormData>(initialData)
  const { data: allowedTags, isLoading: tagsLoading } = useFetchAllowedTagsQuery()

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
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
    <form onSubmit={handleSubmit} data-testid="game-form">
      <Stack spacing={3}>
        {error ? (
          <Alert severity="error" data-testid="game-form-error-alert">
            {error instanceof Error
              ? error.message
              : typeof error === 'object' && error !== null && 'message' in error
              ? String((error as { message: string }).message)
              : 'Failed to submit form'}
          </Alert>
        ) : (
          ''
        )}

        <TextField
          required
          label="Game Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          data-testid="game-form-name-input"
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
          data-testid="game-form-description-input"
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
            data-testid="game-form-min-players-input"
          />

          <TextField
            required
            label="Maximum Players"
            name="maxPlayers"
            type="number"
            value={formData.maxPlayers}
            onChange={handleChange}
            inputProps={{ min: formData.minPlayers }}
            data-testid="game-form-max-players-input"
          />
        </Box>

        <Autocomplete
          multiple
          options={allowedTags?.data || []}
          loading={tagsLoading}
          value={formData.tags}
          onChange={handleTagsChange}
          data-testid="game-form-tags-input"
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index })
              const { key, ...chipProps } = tagProps
              return <Chip key={key} variant="outlined" label={option} {...chipProps} />
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              helperText="Select tags to categorize your game"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {tagsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <FormControlLabel
          control={
            <Switch
              checked={formData.public}
              onChange={handleChange}
              name="public"
              color="primary"
              data-testid="game-form-public-switch"
            />
          }
          label={
            <Box>
              <Box component="span" sx={{ fontWeight: 'medium' }}>
                {formData.public ? 'Public' : 'Private'}
              </Box>
              <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>
                {formData.public
                  ? 'Game will appear in search results for all users'
                  : 'Game will only be visible to your group members'}
              </Box>
            </Box>
          }
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(cancelUrl)}
            disabled={isLoading}
            data-testid="game-form-cancel-button">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
            data-testid="game-form-submit-button">
            {submitButtonText}
          </Button>
        </Box>
      </Stack>
    </form>
  )
}

export default GameForm
