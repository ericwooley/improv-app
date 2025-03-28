import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageHeader,
  Breadcrumb,
  FormContainer,
  InputField,
  TextareaField,
  FormActions,
  ActionButton,
} from '../components'

interface Group {
  id: string
  name: string
  description: string
  createdAt: Date
}

interface NewGroupPageProps {
  onCreateGroup?: (group: Group) => void
}

const NewGroupPage = ({ onCreateGroup }: NewGroupPageProps) => {
  const navigate = useNavigate()
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
  })

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()

    // Create a new group object
    const groupToAdd: Group = {
      id: Date.now().toString(), // temporary ID until backend integration
      name: newGroup.name,
      description: newGroup.description,
      createdAt: new Date(),
    }

    // Call the callback if provided
    if (onCreateGroup) {
      onCreateGroup(groupToAdd)
    }

    // Navigate back to groups page
    navigate('/groups')
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
        <InputField
          id="name"
          label="Group Name"
          value={newGroup.name}
          placeholder="My Improv Group"
          required
          icon="fas fa-theater-masks"
          onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
        />

        <TextareaField
          id="description"
          label="Description"
          value={newGroup.description}
          placeholder="Tell us about your group..."
          rows={3}
          onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
        />

        <FormActions>
          <ActionButton text="Cancel" to="/groups" variant="light" />
          <ActionButton text="Create Group" icon="fas fa-check" type="submit" />
        </FormActions>
      </FormContainer>
    </div>
  )
}

export default NewGroupPage
