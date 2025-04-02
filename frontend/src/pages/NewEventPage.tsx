import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, Breadcrumb, EventForm } from '../components'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { useCreateEventMutation } from '../store/api/eventsApi'
import { EventFormData } from '../components/events/EventForm'
import { Box, CircularProgress, Alert } from '@mui/material'

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
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation()

  // Initial form values
  const initialFormData: EventFormData = {
    title: '',
    description: '',
    location: '',
    groupId: '',
    startTime: '',
    endTime: '',
  }

  const handleSubmit = async (formData: EventFormData) => {
    try {
      // Create a new event object
      const eventToAdd = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        groupId: formData.groupId,
      }

      // Call the API to create the event
      await createEvent(eventToAdd).unwrap()

      // Navigate back to the group page or events page
      if (formData.groupId) {
        navigate(`/groups/${formData.groupId}`)
      } else {
        navigate('/events')
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

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

  // Get the group name for the breadcrumb if groupId is provided
  const selectedGroup = groupsResponse.data.find((g: Group) => g.ID === groupIdFromUrl)
  const groupName = selectedGroup?.Name || ''

  return (
    <div className="content-wrapper">
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          ...(groupName ? [{ label: groupName, to: `/groups/${groupIdFromUrl}` }] : []),
          { label: 'Create New Event', active: true },
        ]}
      />

      <PageHeader title="Create New Event" subtitle="Schedule a new improv event" />

      <EventForm
        initialData={initialFormData}
        onSubmit={handleSubmit}
        isLoading={isCreating}
        submitButtonText="Create Event"
        cancelUrl={groupIdFromUrl ? `/groups/${groupIdFromUrl}` : '/events'}
        preSelectedGroupId={groupIdFromUrl || undefined}
      />
    </div>
  )
}

export default NewEventPage
