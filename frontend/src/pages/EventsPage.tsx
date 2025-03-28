import { useState } from 'react'
import { PageHeader, EmptyState, InfoItem, formatDate, formatTime } from '../components'
import { Box, Typography, Grid, Card, CardContent, CardHeader, CardActions, Button } from '@mui/material'
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

interface EventsPageProps {
  initialEvents?: Event[]
}

const EventsPage = ({ initialEvents = [] }: EventsPageProps) => {
  const [events] = useState<Event[]>(initialEvents)

  return (
    <Box>
      <PageHeader title="Improv Events" subtitle="View upcoming improv events" />

      {events.length > 0 ? (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
              key={event.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader title={event.title} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {event.description}
                  </Typography>

                  <InfoItem icon="fas fa-users">{event.groupName}</InfoItem>

                  <InfoItem icon="fas fa-map-marker-alt">{event.location}</InfoItem>

                  <InfoItem icon="fas fa-calendar-day">{formatDate(event.startTime)}</InfoItem>

                  <InfoItem icon="fas fa-clock">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </InfoItem>
                </CardContent>

                <CardActions>
                  <Button component={Link} to={`/events/${event.id}`} variant="outlined" color="primary" size="small">
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState message="No events have been scheduled yet." />
      )}
    </Box>
  )
}

export default EventsPage
