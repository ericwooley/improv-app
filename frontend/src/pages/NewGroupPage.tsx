import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateGroupMutation } from '../store/api/groupsApi'
import {
  PageHeader,
  Breadcrumb,
  FormContainer,
  InputField,
  TextareaField,
  FormActions,
  ActionButton,
} from '../components'

const NewGroupPage = () => {
  const navigate = useNavigate()
  const [createGroup, { isLoading, error }] = useCreateGroupMutation()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createGroup(formData).unwrap()
      navigate('/groups')
    } catch (err) {
      // Error is handled by the mutation hook
      console.error('Failed to create group:', err)
    }
  }

  return (
    <div className="content-wrapper">
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          { label: 'Create New Group', active: true },
        ]}
      />

      <PageHeader title="Create New Group" subtitle="Set up a new improv group" />

      <FormContainer onSubmit={handleCreateGroup}>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error instanceof Error ? error.message : 'Failed to create group'}
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
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={isLoading}
        />

        <FormActions>
          <ActionButton text="Cancel" to="/groups" variant="light" disabled={isLoading} />
          <ActionButton text="Create Group" icon="fas fa-check" type="submit" disabled={isLoading} />
        </FormActions>
      </FormContainer>
    </div>
  )
}

export default NewGroupPage
