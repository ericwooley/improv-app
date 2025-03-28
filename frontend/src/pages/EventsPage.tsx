import { useState } from 'react'
import { PageHeader, CardGrid, ItemCard, EmptyState, InfoItem, formatDate, formatTime } from '../components'

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

interface EventsPageProps {
  initialEvents?: Event[]
}

const EventsPage = ({ initialEvents = [] }: EventsPageProps) => {
  const [events] = useState<Event[]>(initialEvents)

  return (
    <div className="content-wrapper">
      <PageHeader title="Improv Events" subtitle="View upcoming improv events" />

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
        <EmptyState message="No events have been scheduled yet." />
      )}
    </div>
  )
}

export default EventsPage
