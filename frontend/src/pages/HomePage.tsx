import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { useGetEventsQuery } from '../store/api/eventsApi'
import { Group } from '../store/api/groupsApi'
import { Event } from '../store/api/eventsApi'
import { CardGrid, ItemCard, ActionButton, InfoItem, formatDate, formatTime, GroupCard } from '../components'

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

  return (
    <div className="content-wrapper">
      {isAuthenticated && user ? (
        <>
          <div className="mb-5">
            <h1 className="title is-2">Dashboard</h1>
          </div>

          <div className="columns is-desktop">
            {/* Quick Actions */}
            <div className="column is-12-tablet is-3-desktop">
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
                  <div className="buttons is-centered-mobile">
                    <ActionButton
                      text="New Group"
                      to="/groups/new"
                      icon="fas fa-users"
                      variant="primary"
                      fullWidth
                      className="mb-3"
                    />
                    <ActionButton
                      text="New Event"
                      to="/events/new"
                      icon="fas fa-calendar-plus"
                      variant="info"
                      fullWidth
                      className="mb-3"
                    />
                    <ActionButton
                      text="Start Game"
                      to="/games/play"
                      icon="fas fa-play-circle"
                      variant="success"
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Your Groups */}
            <div className="column is-12-tablet is-9-desktop">
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
                        <GroupCard key={group.ID} group={group} variant="compact" />
                      ))}
                    </div>
                  ) : (
                    <div className="notification is-light has-text-centered">
                      <p>You haven't joined any groups yet.</p>
                      <ActionButton
                        text="Create Group"
                        to="/groups/new"
                        icon="fas fa-plus"
                        size="small"
                        className="mt-3"
                      />
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
                <CardGrid>
                  {events.map((event: Event) => (
                    <div key={event.id} className="column is-12-mobile is-6-tablet is-4-desktop">
                      <ItemCard id={event.id} title={event.title} description={event.description}>
                        <InfoItem icon="fas fa-map-marker-alt">{event.location}</InfoItem>

                        <InfoItem icon="fas fa-calendar">{formatDate(event.startTime)}</InfoItem>

                        <InfoItem icon="fas fa-clock">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </InfoItem>

                        <ActionButton
                          text="View Details"
                          to={`/events/${event.id}`}
                          icon="fas fa-arrow-right"
                          variant="link"
                          outlined
                          fullWidth
                        />
                      </ItemCard>
                    </div>
                  ))}
                </CardGrid>
              ) : (
                <div className="notification is-light has-text-centered">
                  <p>No upcoming events scheduled.</p>
                  <ActionButton text="Create Event" to="/events/new" icon="fas fa-plus" size="small" className="mt-3" />
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
              <h1 className="title is-1 is-size-2-mobile">Welcome to Improv App</h1>
              <p className="subtitle is-4 is-size-5-mobile mb-6">
                Organize your improv groups, events, and games all in one place.
              </p>

              <div className="columns is-centered">
                <div className="column is-12-mobile is-8-tablet">
                  <div className="box has-background-white p-6 p-4-mobile">
                    <div className="mb-6 mb-4-mobile">
                      <span className="icon is-large has-text-primary">
                        <i className="fas fa-theater-masks fa-3x"></i>
                      </span>
                    </div>
                    <h2 className="title is-3 is-size-4-mobile mb-4">Get Started Today</h2>
                    <p className="subtitle is-5 is-size-6-mobile mb-5">
                      Join our community of improvisers to organize groups, schedule events, and discover new games.
                    </p>
                    <div className="buttons is-centered">
                      <ActionButton
                        text="Sign In"
                        to="/login"
                        icon="fas fa-sign-in-alt"
                        variant="primary"
                        size="large"
                      />
                      <ActionButton
                        text="Register"
                        to="/register"
                        icon="fas fa-user-plus"
                        variant="link"
                        size="large"
                      />
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
