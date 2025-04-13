import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, EventForm } from '../components'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { useCreateEventMutation } from '../store/api/eventsApi'
import { EventFormData } from '../components/events/EventForm'
import { Box, CircularProgress, Alert } from '@mui/material'

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
  }

  const handleSubmit = async (formData: EventFormData) => {
    try {
      // Create a new event object
      const eventToAdd = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startTime: new Date(formData.startTime).toISOString(),
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

  return (
    <div className="content-wrapper">
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
