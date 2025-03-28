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
  const [events] = useState<Event[]>(initialEvents)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="content-wrapper">
      <div className="is-flex is-flex-direction-column-mobile is-justify-content-space-between is-align-items-start-mobile mb-5">
        <div className="mb-4-mobile">
          <h1 className="title is-2">Improv Events</h1>
          <p className="subtitle is-5">Schedule and manage your improv events</p>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mb-5">
          {groups.length > 0 ? (
            <Link to="/events/new" className="button is-primary">
              <span className="icon">
                <i className="fas fa-plus"></i>
              </span>
              <span>Create Event</span>
            </Link>
          ) : (
            <Link to="/groups/new" className="button is-primary">
              <span className="icon">
                <i className="fas fa-users"></i>
              </span>
              <span>Create Group First</span>
            </Link>
          )}
        </div>
      )}

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
            <Link to="/events/new" className="button is-primary">
              <span className="icon">
                <i className="fas fa-plus"></i>
              </span>
              <span>Schedule Your First Event</span>
            </Link>
          ) : (
            <div>
              <p className="mb-4">You need to create a group before scheduling events.</p>
              <Link to="/groups/new" className="button is-primary">
                <span className="icon">
                  <i className="fas fa-users"></i>
                </span>
                <span>Create a Group</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EventsPage
