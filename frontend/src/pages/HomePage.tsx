import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { useGetEventsQuery } from '../store/api/eventsApi'
import { Group } from '../store/api/groupsApi'
import { Event } from '../store/api/eventsApi'

// Define API response structure
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
}

const HomePage = () => {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const { data: groupsResponse, isLoading: groupsLoading } = useGetGroupsQuery()
  const { data: eventsResponse, isLoading: eventsLoading } = useGetEventsQuery()

  const groups = (groupsResponse as unknown as ApiResponse<Group[]>)?.data || []
  const events = (eventsResponse as unknown as ApiResponse<Event[]>)?.data || []

  const formatDate = (dateStr: string | Date) => {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateStr: string | Date) => {
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="content-wrapper">
      {isAuthenticated && user ? (
        <>
          <div className="mb-5">
            <h1 className="title is-2">Dashboard</h1>
            <p className="subtitle is-5">Welcome back, {user.firstName}!</p>
          </div>

          <div className="columns">
            {/* Quick Actions */}
            <div className="column is-3">
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">
                    <span className="icon mr-2">
                      <i className="fas fa-bolt"></i>
                    </span>
                    Quick Actions
                  </p>
                </header>
                <div className="card-content">
                  <div className="buttons are-medium">
                    <Link to="/groups/new" className="button is-primary is-fullwidth mb-3">
                      <span className="icon">
                        <i className="fas fa-users"></i>
                      </span>
                      <span>New Group</span>
                    </Link>
                    <Link to="/events/new" className="button is-info is-fullwidth mb-3">
                      <span className="icon">
                        <i className="fas fa-calendar-plus"></i>
                      </span>
                      <span>New Event</span>
                    </Link>
                    <Link to="/games/play" className="button is-success is-fullwidth">
                      <span className="icon">
                        <i className="fas fa-play-circle"></i>
                      </span>
                      <span>Start Game</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Groups */}
            <div className="column">
              <div className="card">
                <header className="card-header">
                  <p className="card-header-title">
                    <span className="icon mr-2">
                      <i className="fas fa-users"></i>
                    </span>
                    Your Groups
                  </p>
                  <Link to="/groups" className="card-header-icon">
                    <span className="icon">
                      <i className="fas fa-angle-right"></i>
                    </span>
                  </Link>
                </header>
                <div className="card-content">
                  {groupsLoading ? (
                    <div className="has-text-centered p-4">
                      <span className="icon is-large">
                        <i className="fas fa-spinner fa-pulse fa-2x"></i>
                      </span>
                    </div>
                  ) : groups.length > 0 ? (
                    <div className="groups-grid">
                      {groups.map((group: Group) => (
                        <div key={group.id} className="box has-background-white-ter mb-3">
                          <div className="is-flex is-justify-content-space-between is-align-items-center">
                            <div>
                              <h3 className="title is-5 mb-2">{group.name}</h3>
                              <p className="subtitle is-6 has-text-grey">{group.description}</p>
                            </div>
                            <Link to={`/groups/${group.id}`} className="button is-link is-light">
                              <span className="icon">
                                <i className="fas fa-chevron-right"></i>
                              </span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="notification is-light has-text-centered">
                      <p>You haven't joined any groups yet.</p>
                      <Link to="/groups/new" className="button is-primary is-small mt-3">
                        Create Group
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card mt-5">
            <header className="card-header">
              <p className="card-header-title">
                <span className="icon mr-2">
                  <i className="fas fa-calendar-alt"></i>
                </span>
                Upcoming Events
              </p>
              <Link to="/events" className="card-header-icon">
                <span className="icon">
                  <i className="fas fa-angle-right"></i>
                </span>
              </Link>
            </header>
            <div className="card-content">
              {eventsLoading ? (
                <div className="has-text-centered p-4">
                  <span className="icon is-large">
                    <i className="fas fa-spinner fa-pulse fa-2x"></i>
                  </span>
                </div>
              ) : events.length > 0 ? (
                <div className="columns is-multiline">
                  {events.map((event: Event) => (
                    <div key={event.id} className="column is-6">
                      <div className="box has-background-white-ter">
                        <h3 className="title is-5">{event.title}</h3>
                        <p className="subtitle is-6 has-text-grey mb-3">{event.description}</p>
                        <div className="is-flex is-align-items-center mb-3">
                          <span className="icon has-text-info mr-2">
                            <i className="fas fa-map-marker-alt"></i>
                          </span>
                          <span>{event.location}</span>
                        </div>
                        <div className="is-flex is-align-items-center mb-3">
                          <span className="icon has-text-info mr-2">
                            <i className="fas fa-calendar"></i>
                          </span>
                          <span>{formatDate(event.startTime)}</span>
                        </div>
                        <div className="is-flex is-align-items-center mb-3">
                          <span className="icon has-text-info mr-2">
                            <i className="fas fa-clock"></i>
                          </span>
                          <span>
                            {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          </span>
                        </div>
                        <Link to={`/events/${event.id}`} className="button is-link is-outlined is-fullwidth">
                          View Details
                          <span className="icon ml-1">
                            <i className="fas fa-arrow-right"></i>
                          </span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="notification is-light has-text-centered">
                  <p>No upcoming events scheduled.</p>
                  <Link to="/events/new" className="button is-primary is-small mt-3">
                    Create Event
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Welcome Page for Non-logged in Users
        <div className="hero is-medium">
          <div className="hero-body">
            <div className="container has-text-centered">
              <h1 className="title is-1">Welcome to Improv App</h1>
              <p className="subtitle is-4 mb-6">Organize your improv groups, events, and games all in one place.</p>

              <div className="columns is-centered">
                <div className="column is-8">
                  <div className="box has-background-white p-6">
                    <div className="mb-6">
                      <span className="icon is-large has-text-primary">
                        <i className="fas fa-theater-masks fa-3x"></i>
                      </span>
                    </div>
                    <h2 className="title is-3 mb-4">Get Started Today</h2>
                    <p className="subtitle is-5 mb-5">
                      Join our community of improvisers to organize groups, schedule events, and discover new games.
                    </p>
                    <div className="buttons is-centered">
                      <Link to="/login" className="button is-primary is-large">
                        <span className="icon">
                          <i className="fas fa-sign-in-alt"></i>
                        </span>
                        <span>Sign In</span>
                      </Link>
                      <Link to="/register" className="button is-link is-large">
                        <span className="icon">
                          <i className="fas fa-user-plus"></i>
                        </span>
                        <span>Register</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
