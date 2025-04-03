import { useState, useEffect } from 'react'
import { FormContainer, InputField, TextareaField, SelectField, FormActions, ActionButton } from '../index'
import { Box, CircularProgress, Alert, Stack } from '@mui/material'
import { useGetGroupsQuery } from '../../store/api/groupsApi'
import { useGetGroupMembersQuery } from '../../store/api/groupsApi'

interface Group {
  ID: string
  Name: string
}

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export interface EventFormData {
  title: string
  description: string
  location: string
  groupId: string
  startTime: string
  mcId?: string
}

interface EventFormProps {
  initialData: EventFormData
  onSubmit: (formData: EventFormData) => Promise<void>
  isLoading: boolean
  submitButtonText: string
  cancelUrl: string
  preSelectedGroupId?: string
  disableGroupSelect?: boolean
}

const EventForm = ({
  initialData,
  onSubmit,
  isLoading,
  submitButtonText,
  cancelUrl,
  preSelectedGroupId,
  disableGroupSelect = false,
}: EventFormProps) => {
  const [formData, setFormData] = useState<EventFormData>(initialData)
  const { data: groupsResponse, isLoading: groupsLoading } = useGetGroupsQuery()
  const { data: membersResponse } = useGetGroupMembersQuery(formData.groupId, { skip: !formData.groupId })

  // Pre-select the group if provided
  useEffect(() => {
    if (preSelectedGroupId && !formData.groupId) {
      setFormData((prev) => ({ ...prev, groupId: preSelectedGroupId }))
    }
  }, [preSelectedGroupId, formData.groupId])

  // If initialData changes (like when editing an event), update the form
  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  // Convert groups to options for SelectField
  const groupOptions =
    groupsResponse?.data?.map((group: Group) => ({
      value: group.ID,
      label: group.Name,
    })) || []

  // Convert members to options for MC SelectField
  const memberOptions =
    membersResponse?.data?.map((member: Member) => ({
      value: member.id,
      label: `${member.firstName} ${member.lastName}`,
    })) || []

  if (groupsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!groupsResponse?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading groups. Please try again later.</Alert>
      </Box>
    )
  }

  // Get the group name for display when the select is disabled
  const selectedGroup = groupsResponse.data.find((g: Group) => g.ID === formData.groupId)
  const groupName = selectedGroup?.Name || 'Unknown Group'

  return (
    <FormContainer onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <InputField
          id="title"
          label="Event Title"
          value={formData.title}
          placeholder="Weekly Practice"
          required
          icon="fas fa-heading"
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        {disableGroupSelect ? (
          <InputField
            id="group_name"
            label="Group"
            value={groupName}
            icon="fas fa-users"
            disabled
            onChange={() => {}} // No-op function since the field is disabled
          />
        ) : (
          <SelectField
            id="group_id"
            label="Group"
            value={formData.groupId}
            options={groupOptions}
            required
            icon="fas fa-users"
            placeholder="Select a group..."
            onChange={(e) => {
              setFormData({ ...formData, groupId: e.target.value, mcId: '' })
            }}
          />
        )}

        {formData.groupId && (
          <SelectField
            id="mc_id"
            label="Master of Ceremonies (MC)"
            value={formData.mcId || ''}
            options={memberOptions}
            icon="fas fa-microphone"
            placeholder="Select an MC (optional)..."
            onChange={(e) => setFormData({ ...formData, mcId: e.target.value })}
          />
        )}

        <TextareaField
          id="description"
          label="Description"
          value={formData.description}
          placeholder="Details about the event..."
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />

        <InputField
          id="location"
          label="Location"
          value={formData.location}
          placeholder="123 Main St, Suite 101"
          required
          icon="fas fa-map-marker-alt"
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />

        <InputField
          id="start_time"
          label="Start Time"
          type="datetime-local"
          value={formData.startTime}
          required
          icon="fas fa-clock"
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
        />
      </Stack>

      <FormActions>
        <ActionButton text="Cancel" to={cancelUrl} variant="outlined" />
        <ActionButton text={submitButtonText} icon="fas fa-check" type="submit" disabled={isLoading} />
      </FormActions>
    </FormContainer>
  )
}

export default EventForm
