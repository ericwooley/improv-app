import { FormContainer, InputField, TextareaField, FormActions, ActionButton } from './index'
import { Link, Typography, Box } from '@mui/material'

export interface GroupFormData {
  name: string
  description: string
}

interface GroupFormProps {
  formData: GroupFormData
  setFormData: (data: GroupFormData) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onCancel: () => void
  isLoading: boolean
  error?: Error | null
  submitButtonText: string
  submitButtonIcon?: string
  cancelButtonText: string
  cancelButtonTo?: string
}

export const GroupForm = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  error,
  submitButtonText,
  submitButtonIcon = 'fas fa-check',
  cancelButtonText,
  cancelButtonTo,
}: GroupFormProps) => {
  return (
    <FormContainer onSubmit={onSubmit}>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error instanceof Error ? error.message : 'An error occurred'}
        </div>
      )}

      <InputField
        id="name"
        label="Group Name"
        value={formData.name}
        placeholder="My Improv Group"
        required
        icon="fas fa-theater-masks"
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        disabled={isLoading}
      />

      <TextareaField
        id="description"
        label="Description"
        value={formData.description}
        placeholder="Tell us about your group..."
        rows={3}
        last
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        disabled={isLoading}
      />

      <Box sx={{ mt: 1, mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Description supports{' '}
          <Link
            href="https://www.markdownguide.org/basic-syntax/"
            target="_blank"
            rel="noopener"
            data-testid="markdown-guide-link">
            Markdown formatting
          </Link>
        </Typography>
      </Box>

      <FormActions>
        <ActionButton
          text={cancelButtonText}
          to={cancelButtonTo}
          variant="outlined"
          disabled={isLoading}
          onClick={onCancel}
        />
        <ActionButton
          data-testid="group-form-submit-button"
          text={submitButtonText}
          icon={submitButtonIcon}
          type="submit"
          disabled={isLoading}
        />
      </FormActions>
    </FormContainer>
  )
}
