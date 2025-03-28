import { useState } from 'react'
import { Link } from 'react-router-dom'

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

interface Group {
  id: string
  name: string
}

interface EventsPageProps {
  initialEvents?: Event[]
  groups?: Group[]
}

const EventsPage = ({ initialEvents = [], groups = [] }: EventsPageProps) => {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
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

    // Add the new event to the state
    setEvents([...events, eventToAdd])

    // Reset form and close modal
    setNewEvent({
      title: '',
      description: '',
      location: '',
      groupId: '',
      startTime: '',
      endTime: '',
    })
    setIsCreateModalOpen(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="content-wrapper">
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5">
        <div>
          <h1 className="title is-2">Improv Events</h1>
          <p className="subtitle is-5">Schedule and manage your improv events</p>
        </div>
        <div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="button is-primary is-medium"
            disabled={groups.length === 0}>
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="columns is-multiline">
          {events.map((event) => (
            <div key={event.id} className="column is-4">
              <div className="card h-100">
                <div className="card-content">
                  <h2 className="title">{event.title}</h2>
                  <p className="subtitle has-text-grey mb-4">{event.description}</p>

                  <div className="is-flex is-align-items-center mb-3">
                    <span className="icon has-text-info mr-2">
                      <i className="fas fa-users"></i>
                    </span>
                    <span>{event.groupName}</span>
                  </div>

                  <div className="is-flex is-align-items-center mb-3">
                    <span className="icon has-text-info mr-2">
                      <i className="fas fa-map-marker-alt"></i>
                    </span>
                    <span>{event.location}</span>
                  </div>

                  <div className="is-flex is-align-items-center mb-3">
                    <span className="icon has-text-info mr-2">
                      <i className="fas fa-calendar-day"></i>
                    </span>
                    <span>{formatDate(event.startTime)}</span>
                  </div>

                  <div className="is-flex is-align-items-center mb-4">
                    <span className="icon has-text-info mr-2">
                      <i className="fas fa-clock"></i>
                    </span>
                    <span>
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                  <Link
                    to={`/events/${event.id}`}
                    className="card-footer-item is-flex is-justify-content-space-between">
                    <span>View Details</span>
                    <span className="icon">
                      <i className="fas fa-arrow-right"></i>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="notification is-light has-text-centered p-6">
          <p className="mb-4">No events have been scheduled yet.</p>
          {groups.length > 0 ? (
            <button onClick={() => setIsCreateModalOpen(true)} className="button is-primary">
              <span className="icon">
                <i className="fas fa-plus"></i>
              </span>
              <span>Schedule Your First Event</span>
            </button>
          ) : (
            <div>
              <p className="mb-4">You need to create a group before scheduling events.</p>
              <Link to="/groups" className="button is-primary">
                <span className="icon">
                  <i className="fas fa-users"></i>
                </span>
                <span>Create a Group</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      <div className={`modal ${isCreateModalOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setIsCreateModalOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">
              <span className="icon mr-2">
                <i className="fas fa-calendar-plus"></i>
              </span>
              Schedule New Event
            </p>
            <button className="delete" aria-label="close" onClick={() => setIsCreateModalOpen(false)}></button>
          </header>
          <section className="modal-card-body">
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

              <div className="field is-grouped is-grouped-right mt-5">
                <p className="control">
                  <button type="button" className="button is-light" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </button>
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
          </section>
        </div>
      </div>
    </div>
  )
}

export default EventsPage
