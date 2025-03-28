import { useState } from 'react'
import {
  PageHeader,
  CardGrid,
  ItemCard,
  EmptyState,
  ActionButton,
  InfoItem,
  formatDate,
  formatTime,
} from '../components'

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

  return (
    <div className="content-wrapper">
      <PageHeader title="Improv Events" subtitle="Schedule and manage your improv events" />

      {events.length > 0 && (
        <div className="mb-5">
          {groups.length > 0 ? (
            <ActionButton text="Create Event" to="/events/new" icon="fas fa-plus" />
          ) : (
            <ActionButton text="Create Group First" to="/groups/new" icon="fas fa-users" />
          )}
        </div>
      )}

      {events.length > 0 ? (
        <CardGrid>
          {events.map((event) => (
            <div key={event.id} className="column is-4">
              <ItemCard
                id={event.id}
                title={event.title}
                description={event.description}
                footerLink={`/events/${event.id}`}>
                <InfoItem icon="fas fa-users">{event.groupName}</InfoItem>

                <InfoItem icon="fas fa-map-marker-alt">{event.location}</InfoItem>

                <InfoItem icon="fas fa-calendar-day">{formatDate(event.startTime)}</InfoItem>

                <InfoItem icon="fas fa-clock">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </InfoItem>
              </ItemCard>
            </div>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          message="No events have been scheduled yet."
          actionText={groups.length > 0 ? 'Schedule Your First Event' : undefined}
          actionLink={groups.length > 0 ? '/events/new' : undefined}
          actionIcon="fas fa-plus"
          secondaryMessage={groups.length === 0 ? 'You need to create a group before scheduling events.' : undefined}
          secondaryAction={
            groups.length === 0 ? (
              <ActionButton text="Create a Group" to="/groups/new" icon="fas fa-users" />
            ) : undefined
          }
        />
      )}
    </div>
  )
}

export default EventsPage
