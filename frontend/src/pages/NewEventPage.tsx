import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

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

  return (
    <div className="content-wrapper">
      <nav className="breadcrumb has-arrow-separator mb-5" aria-label="breadcrumbs">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/events">Events</Link>
          </li>
          <li className="is-active">
            <a href="#" aria-current="page">
              Create New Event
            </a>
          </li>
        </ul>
      </nav>

      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5">
        <div>
          <h1 className="title is-2">Create New Event</h1>
          <p className="subtitle is-5">Schedule a new improv event</p>
        </div>
      </div>

      <div className="box">
        <form onSubmit={handleCreateEvent}>
          <div className="field">
            <label htmlFor="title" className="label">
              Event Title
            </label>
            <div className="control has-icons-left">
              <input
                type="text"
                id="title"
                required
                className="input"
                placeholder="Weekly Practice"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
              <span className="icon is-small is-left">
                <i className="fas fa-heading"></i>
              </span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="group_id" className="label">
              Group
            </label>
            <div className="control has-icons-left">
              <div className="select is-fullwidth">
                <select
                  id="group_id"
                  required
                  value={newEvent.groupId}
                  onChange={(e) => setNewEvent({ ...newEvent, groupId: e.target.value })}>
                  <option value="">Select a group...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <span className="icon is-small is-left">
                <i className="fas fa-users"></i>
              </span>
            </div>
          </div>

          <div className="field">
            <label htmlFor="description" className="label">
              Description
            </label>
            <div className="control">
              <textarea
                id="description"
                className="textarea"
                placeholder="Details about the event..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}></textarea>
            </div>
          </div>

          <div className="field">
            <label htmlFor="location" className="label">
              Location
            </label>
            <div className="control has-icons-left">
              <input
                type="text"
                id="location"
                required
                className="input"
                placeholder="123 Main St, Suite 101"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
              <span className="icon is-small is-left">
                <i className="fas fa-map-marker-alt"></i>
              </span>
            </div>
          </div>

          <div className="columns">
            <div className="column">
              <div className="field">
                <label htmlFor="start_time" className="label">
                  Start Time
                </label>
                <div className="control has-icons-left">
                  <input
                    type="datetime-local"
                    id="start_time"
                    required
                    className="input"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                  <span className="icon is-small is-left">
                    <i className="fas fa-clock"></i>
                  </span>
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <label htmlFor="end_time" className="label">
                  End Time
                </label>
                <div className="control has-icons-left">
                  <input
                    type="datetime-local"
                    id="end_time"
                    required
                    className="input"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                  <span className="icon is-small is-left">
                    <i className="fas fa-clock"></i>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="field is-grouped mt-5">
            <p className="control">
              <Link to="/events" className="button is-light">
                Cancel
              </Link>
            </p>
            <p className="control">
              <button type="submit" className="button is-primary">
                <span className="icon">
                  <i className="fas fa-check"></i>
                </span>
                <span>Create Event</span>
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewEventPage
