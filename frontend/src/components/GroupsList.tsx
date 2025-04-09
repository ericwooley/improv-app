import { Box, List, ListItemButton, ListItemText, ListItemIcon, CircularProgress, Typography } from '@mui/material'
import { Group as GroupIcon } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { Group } from '../store/api/groupsApi'
import EmptyState from './EmptyState'

interface GroupsListProps {
  groups: Group[]
  isLoading: boolean
  error?: unknown
  maxItems?: number
  emptyMessage?: string
  emptyActionText?: string
  emptyActionLink?: string
  testId?: string
}

export const GroupsList = ({
  groups = [],
  isLoading,
  error,
  maxItems,
  emptyMessage = "You haven't created any groups yet.",
  emptyActionText = 'Create Your First Group',
  emptyActionLink = '/groups/new',
  testId = 'groups-list',
}: GroupsListProps) => {
  const displayGroups = maxItems ? groups.slice(0, maxItems) : groups

  return (
    <>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ mt: 2 }}>
          Error loading groups. Please try again later.
        </Typography>
      ) : groups.length > 0 ? (
        <List data-testid={testId}>
          {displayGroups.map((group) => (
            <ListItemButton key={group.ID} component={Link} to={`/groups/${group.ID}`}>
              <ListItemIcon>
                <GroupIcon />
              </ListItemIcon>
              <ListItemText primary={group.Name} secondary={group.Description} />
            </ListItemButton>
          ))}
        </List>
      ) : (
        <EmptyState
          message={emptyMessage}
          actionText={emptyActionText}
          actionLink={emptyActionLink}
          actionIcon="fas fa-plus"
          actionTestId="create-group-button"
        />
      )}
    </>
  )
}
