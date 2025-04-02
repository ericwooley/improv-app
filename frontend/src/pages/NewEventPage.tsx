import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  PageHeader,
  Breadcrumb,
  FormContainer,
  InputField,
  TextareaField,
  SelectField,
  FormActions,
  ActionButton,
} from '../components'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { useGetEventsByGroupQuery, useCreateEventMutation } from '../store/api/eventsApi'
import { Box, CircularProgress, Alert, Grid, Stack } from '@mui/material'

interface Group {
  ID: string
  Name: string
}

// We're keeping this interface for reference, but it's not directly used in this component
// It matches the structure expected by the API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Event {
  id: string
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  groupId: string
  groupName?: string
}

const NewEventPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupIdFromUrl = searchParams.get('groupId')

  const { data: groupsResponse, isLoading: groupsLoading } = useGetGroupsQuery()
  // We're not using the events data yet, but we might need it later
  const { isLoading: eventsLoading } = useGetEventsByGroupQuery(groupIdFromUrl || '')
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation()

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    groupId: groupIdFromUrl || '',
    startTime: '',
    endTime: '',
  })

  // Pre-select the group if groupId is provided in URL
  useEffect(() => {
    if (groupIdFromUrl) {
      setNewEvent((prev) => ({ ...prev, groupId: groupIdFromUrl }))
    }
  }, [groupIdFromUrl])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Create a new event object
      const eventToAdd = {
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        startTime: new Date(newEvent.startTime).toISOString(),
        endTime: new Date(newEvent.endTime).toISOString(),
        groupId: newEvent.groupId,
      }

      // Call the API to create the event
      await createEvent(eventToAdd).unwrap()

      // Navigate back to the group page or events page
      if (newEvent.groupId) {
        navigate(`/groups/${newEvent.groupId}`)
      } else {
        navigate('/events')
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  // Convert groups to options for SelectField
  const groupOptions =
    groupsResponse?.data?.map((group: Group) => ({
      value: group.ID,
      label: group.Name,
    })) || []

  if (groupsLoading || eventsLoading) {
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

  // Get the group name for the breadcrumb if groupId is provided
  const selectedGroup = groupsResponse.data.find((g: Group) => g.ID === newEvent.groupId)
  const groupName = selectedGroup?.Name || ''

  return (
    <div className="content-wrapper">
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          ...(groupName ? [{ label: groupName, to: `/groups/${newEvent.groupId}` }] : []),
          { label: 'Create New Event', active: true },
        ]}
      />

      <PageHeader title="Create New Event" subtitle="Schedule a new improv event" />

      <FormContainer onSubmit={handleCreateEvent}>
        <Stack spacing={3}>
          <InputField
            id="title"
            label="Event Title"
            value={newEvent.title}
            placeholder="Weekly Practice"
            required
            icon="fas fa-heading"
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          />

          <SelectField
            id="group_id"
            label="Group"
            value={newEvent.groupId}
            options={groupOptions}
            required
            icon="fas fa-users"
            placeholder="Select a group..."
            onChange={(e) => setNewEvent({ ...newEvent, groupId: e.target.value })}
          />

          <TextareaField
            id="description"
            label="Description"
            value={newEvent.description}
            placeholder="Details about the event..."
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
          />

          <InputField
            id="location"
            label="Location"
            value={newEvent.location}
            placeholder="123 Main St, Suite 101"
            required
            icon="fas fa-map-marker-alt"
            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
          />

          <Grid container spacing={2}>
            <Grid size={6}>
              <InputField
                id="start_time"
                label="Start Time"
                type="datetime-local"
                value={newEvent.startTime}
                required
                icon="fas fa-clock"
                onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <InputField
                id="end_time"
                label="End Time"
                type="datetime-local"
                value={newEvent.endTime}
                required
                icon="fas fa-clock"
                onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
              />
            </Grid>
          </Grid>
        </Stack>

        <FormActions>
          <ActionButton
            text="Cancel"
            to={newEvent.groupId ? `/groups/${newEvent.groupId}` : '/events'}
            variant="outlined"
          />
          <ActionButton text="Create Event" icon="fas fa-check" type="submit" disabled={isCreating} />
        </FormActions>
      </FormContainer>
    </div>
  )
}

export default NewEventPage
