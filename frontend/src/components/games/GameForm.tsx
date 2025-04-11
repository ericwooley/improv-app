import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFetchAllowedTagsQuery } from '../../store/api/gamesApi'
import {
  Stack,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
  Autocomplete,
  Box,
  TextField,
  Typography,
  Link,
} from '@mui/material'
import InputField from '../InputField'
import TextareaField from '../TextareaField'
import ActionButton from '../ActionButton'
import FormActions from '../FormActions'

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

    // Create a new object with properly typed values
    const submissionData = {
      ...formData,
      // Ensure minPlayers and maxPlayers are integers
      minPlayers: parseInt(formData.minPlayers.toString(), 10),
      maxPlayers: parseInt(formData.maxPlayers.toString(), 10),
    }

    await onSubmit(submissionData)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>
  ) => {
    const { name, value, checked } = e.target as HTMLInputElement

    if (name === 'minPlayers' || name === 'maxPlayers') {
      // Parse number inputs to integers
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value, 10),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name as string]: name === 'public' ? checked : value,
      }))
    }
  }

  const handleTagsChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    setFormData((prev) => ({
      ...prev,
      tags: newValue,
    }))
  }

  return (
    <form onSubmit={handleSubmit} data-testid="game-form">
      <Stack spacing={3} data-testid="game-form-stack">
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

        <InputField
          id="name"
          name="name"
          label="Game Name"
          value={formData.name}
          required
          onChange={handleChange}
          testId="game-form-name-input"
        />

        <TextareaField
          id="description"
          name="description"
          label="Description"
          value={formData.description}
          rows={4}
          required
          onChange={handleChange}
          testId="game-form-description-input"
        />

        <Box sx={{ mt: -2, mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Description supports{' '}
            <Link
              href="https://www.markdownguide.org/basic-syntax/"
              target="_blank"
              rel="noopener"
              data-testid="game-form-markdown-guide-link">
              Markdown formatting
            </Link>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }} data-testid="game-form-players-container">
          <InputField
            id="minPlayers"
            name="minPlayers"
            label="Minimum Players"
            value={formData.minPlayers.toString()}
            type="number"
            required
            onChange={handleChange}
            testId="game-form-min-players-input"
          />

          <InputField
            id="maxPlayers"
            name="maxPlayers"
            label="Maximum Players"
            value={formData.maxPlayers.toString()}
            type="number"
            required
            onChange={handleChange}
            testId="game-form-max-players-input"
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
              return (
                <Chip
                  key={key}
                  variant="outlined"
                  label={option}
                  {...chipProps}
                  data-testid={`game-form-tag-chip-${option.toLowerCase().replace(/\s+/g, '-')}`}
                />
              )
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              name="tags"
              label="Tags"
              helperText="Select tags to categorize your game"
              fullWidth
              data-testid="game-form-tags-textfield"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {tagsLoading ? (
                      <CircularProgress color="inherit" size={20} data-testid="game-form-tags-loading" />
                    ) : null}
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
            <Box data-testid="game-form-public-label">
              <Box component="span" sx={{ fontWeight: 'medium' }} data-testid="game-form-public-status">
                {formData.public ? 'Public' : 'Private'}
              </Box>
              <Box
                component="span"
                sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}
                data-testid="game-form-public-description">
                {formData.public
                  ? 'Game will appear in search results for all users'
                  : 'Game will only be visible to your group members'}
              </Box>
            </Box>
          }
          data-testid="game-form-public-control"
        />

        <FormActions>
          <ActionButton
            text="Cancel"
            variant="outlined"
            onClick={() => navigate(cancelUrl)}
            disabled={isLoading}
            testId="game-form-cancel-button"
          />
          <ActionButton
            text={submitButtonText}
            type="submit"
            variant="contained"
            disabled={isLoading}
            icon={isLoading ? <CircularProgress size={20} data-testid="game-form-submit-loading" /> : undefined}
            testId="game-form-submit-button"
          />
        </FormActions>
      </Stack>
    </form>
  )
}

export default GameForm
