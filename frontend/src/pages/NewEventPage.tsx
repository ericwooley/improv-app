import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

interface Group {
  id: string
  name: string
}

interface Event {
  id: string
  title: string
  description: string
  location: string
  startTime: Date
  endTime: Date
  groupId: string
  groupName: string
}

interface NewEventPageProps {
  groups?: Group[]
  onCreateEvent?: (event: Event) => void
}

const NewEventPage = ({ groups = [], onCreateEvent }: NewEventPageProps) => {
  const navigate = useNavigate()
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    groupId: '',
    startTime: '',
    endTime: '',
  })

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()

    // Create a new event object
    const eventToAdd: Event = {
      id: Date.now().toString(), // temporary ID until backend integration
      title: newEvent.title,
      description: newEvent.description,
      location: newEvent.location,
      startTime: new Date(newEvent.startTime),
      endTime: new Date(newEvent.endTime),
      groupId: newEvent.groupId,
      groupName: groups.find((g) => g.id === newEvent.groupId)?.name || 'Unknown Group',
    }

    // Call the callback if provided
    if (onCreateEvent) {
      onCreateEvent(eventToAdd)
    }

    // Navigate back to events page
    navigate('/events')
  }

  // Convert groups to options for SelectField
  const groupOptions = groups.map((group) => ({
    value: group.id,
    label: group.name,
  }))

  return (
    <div className="content-wrapper">
      <Breadcrumb
        items={[
          { label: 'Events', to: '/events' },
          { label: 'Create New Event', active: true },
        ]}
      />

      <PageHeader title="Create New Event" subtitle="Schedule a new improv event" />

      <FormContainer onSubmit={handleCreateEvent}>
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

        <div className="columns">
          <div className="column">
            <InputField
              id="start_time"
              label="Start Time"
              type="datetime-local"
              value={newEvent.startTime}
              required
              icon="fas fa-clock"
              onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
            />
          </div>
          <div className="column">
            <InputField
              id="end_time"
              label="End Time"
              type="datetime-local"
              value={newEvent.endTime}
              required
              icon="fas fa-clock"
              onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
            />
          </div>
        </div>

        <FormActions>
          <ActionButton text="Cancel" to="/events" variant="light" />
          <ActionButton text="Create Event" icon="fas fa-check" type="submit" />
        </FormActions>
      </FormContainer>
    </div>
  )
}

export default NewEventPage
