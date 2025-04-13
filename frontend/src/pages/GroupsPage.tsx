import { PageHeader, GroupsList } from '../components'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { Box, Paper, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material'
import { MoreVert as MoreVertIcon, Add as AddIcon } from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const GroupsPage = () => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const {
    data: groupsResponse,
    isLoading,
    error,
  } = useGetGroupsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const groups = groupsResponse?.data || []

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleCreateGroup = () => {
    navigate('/groups/new')
    handleMenuClose()
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Improv Groups"
        subtitle="Manage and explore your improv groups"
        actions={
          groups.length > 0 && (
            <IconButton onClick={handleMenuOpen} aria-label="group actions" data-testid="groups-actions-button">
              <MoreVertIcon />
            </IconButton>
          )
        }
      />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} data-testid="groups-actions-menu">
        <MenuItem onClick={handleCreateGroup} data-testid="create-group-button">
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Group</ListItemText>
        </MenuItem>
      </Menu>

      <Paper sx={{ mt: 3 }}>
        <GroupsList
          groups={groups}
          isLoading={isLoading}
          error={error}
          emptyMessage="You haven't created any groups yet."
          emptyActionText="Create Your First Group"
          emptyActionLink="/groups/new"
        />
      </Paper>
    </Box>
  )
}

export default GroupsPage
