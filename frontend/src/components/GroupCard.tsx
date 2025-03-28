import { ActionButton, InfoItem, formatDate } from './index'
import { Group } from '../store/api/groupsApi'
import { Box, Typography, Card, CardContent, CardActions } from '@mui/material'

interface GroupCardProps {
  group: Group
  variant?: 'default' | 'compact'
}

export const GroupCard = ({ group, variant = 'default' }: GroupCardProps) => {
  if (variant === 'compact') {
    return (
      <Card elevation={0} sx={{}}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
            }}>
            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
              <Typography variant="h6">{group.Name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {group.Description}
              </Typography>
            </Box>
            <ActionButton text="" to={`/groups/${group.ID}`} icon="fas fa-chevron-right" variant="text" />
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card elevation={0}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {group.Name}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {group.Description}
        </Typography>
        <InfoItem icon="fas fa-calendar-alt">
          <Typography variant="caption">Created {formatDate(new Date(group.CreatedAt))}</Typography>
        </InfoItem>
      </CardContent>
      <CardActions>
        <ActionButton text="View Group" to={`/groups/${group.ID}`} variant="text" />
      </CardActions>
    </Card>
  )
}
