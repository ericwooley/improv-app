import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader, Breadcrumb, EventForm } from '../components'
import { useGetEventQuery, useUpdateEventMutation } from '../store/api/eventsApi'
import { EventFormData } from '../components/events/EventForm'
import { Box, CircularProgress, Alert } from '@mui/material'

const EditEventPage = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const { data: eventResponse, isLoading: eventLoading, error: eventError } = useGetEventQuery(eventId || '')
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation()

  const [initialData, setInitialData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    groupId: '',
    startTime: '',
    endTime: '',
  })

  // When event data is loaded, populate the form
  useEffect(() => {
    if (eventResponse?.data?.event) {
      const event = eventResponse.data.event

      // Format ISO dates to local datetime format for input fields
      const startDate = new Date(event.StartTime)
      const endDate = new Date(event.EndTime)

      const formatDateForInput = (date: Date) => {
        return date.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
      }

      setInitialData({
        title: event.Title || '',
        description: event.Description || '',
        location: event.Location || '',
        groupId: event.GroupID || '',
        startTime: formatDateForInput(startDate),
        endTime: formatDateForInput(endDate),
      })
    }
  }, [eventResponse])

  const handleSubmit = async (formData: EventFormData) => {
    if (!eventId) return

    try {
      await updateEvent({
        id: eventId,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        // Not sending groupId since we don't want to change it
      }).unwrap()

      // Navigate back to event details
      navigate(`/events/${eventId}`)
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  // Show loading state
  if (eventLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Show error state
  if (eventError || !eventResponse?.data?.event) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<button onClick={() => navigate('/events')}>Back to Events</button>}>
          Error loading event. You may not have permission to edit this event.
        </Alert>
      </Box>
    )
  }

  const event = eventResponse.data.event
  const groupName = eventResponse.data.groupName || ''

  return (
    <div className="content-wrapper">
      <Breadcrumb
        items={[
          { label: 'Events', to: '/events' },
          ...(groupName ? [{ label: groupName, to: `/groups/${event.GroupID}` }] : []),
          { label: event.Title, to: `/events/${eventId}` },
          { label: 'Edit', active: true },
        ]}
      />

      <PageHeader title="Edit Event" subtitle="Update event details" />

      <EventForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={isUpdating}
        submitButtonText="Update Event"
        cancelUrl={`/events/${eventId}`}
        disableGroupSelect={true}
      />
    </div>
  )
}

export default EditEventPage
