import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  useGetGroupQuery,
  useGetGroupLibraryGamesQuery,
  useGetGroupOwnedGamesQuery,
  useGetGroupInviteLinksQuery,
  useCreateGroupInviteLinkMutation,
  useUpdateGroupInviteLinkStatusMutation,
  useRemoveMemberMutation,
} from '../store/api/groupsApi'
import { useGetEventsByGroupQuery } from '../store/api/eventsApi'
import {
  PageHeader,
  Breadcrumb,
  GroupInfoTab,
  GroupMembersTab,
  GroupGamesTab,
  GroupInvitesTab,
  GroupEventsTab,
  TabPanel,
  a11yProps,
  TabValue,
  indexToTabValue,
  tabValueToIndex,
} from '../components'
import {
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import {
  Info as InfoIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  SportsEsports as GamepadIcon,
  People as PeopleIcon,
  Link as LinkIcon,
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { ROLE_ADMIN, ROLE_ORGANIZER } from '../constants/roles'

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: groupResponse, isLoading, error } = useGetGroupQuery(groupId || '')
  const { data: libraryGamesResponse, isLoading: libraryLoading } = useGetGroupLibraryGamesQuery(groupId || '')
  const { data: ownedGamesResponse, isLoading: ownedLoading } = useGetGroupOwnedGamesQuery(groupId || '')
  const { data: eventsResponse, isLoading: eventsLoading } = useGetEventsByGroupQuery(groupId || '', {
    skip: !groupId,
  })

  // Determine if user can manage invites based on role
  const userRole = groupResponse?.data?.userRole || ''
  const isAdmin = userRole === ROLE_ADMIN
  const isOrganizer = userRole === ROLE_ORGANIZER
  const canManageInvites = isAdmin || isOrganizer

  // Only fetch invite links if user has permission to manage them
  const { data: inviteLinksResponse } = useGetGroupInviteLinksQuery(groupId || '', {
    skip: !canManageInvites || !groupId,
  })

  const [createInviteLink] = useCreateGroupInviteLinkMutation()
  const [updateInviteLinkStatus] = useUpdateGroupInviteLinkStatusMutation()
  const [removeMember] = useRemoveMemberMutation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  // Get tab from URL params or default to info
  const tabFromUrl = searchParams.get('tab') || TabValue.Info
  const [mainTabValue, setMainTabValue] = useState(tabValueToIndex[tabFromUrl] || 0)

  // Sync URL when tab changes
  useEffect(() => {
    const currentTabValue = indexToTabValue[mainTabValue]
    if (searchParams.get('tab') !== currentTabValue) {
      setSearchParams({ tab: currentTabValue })
    }
  }, [mainTabValue, searchParams, setSearchParams])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue)
  }

  const handleCreateInviteLink = (description: string, expiresAt: string) => {
    if (groupId) {
      createInviteLink({
        groupId,
        data: { description, expiresAt },
      })
    }
  }

  const handleUpdateInviteLinkStatus = (linkId: string, active: boolean) => {
    if (groupId) {
      updateInviteLinkStatus({
        groupId,
        linkId,
        data: { active },
      })
    }
  }

  const handleLeaveGroupClick = () => {
    setLeaveDialogOpen(true)
    handleMenuClose()
  }

  const handleLeaveDialogClose = () => {
    setLeaveDialogOpen(false)
  }

  const handleLeaveGroupConfirm = async () => {
    if (groupId && groupResponse?.data?.userRole) {
      try {
        const userId = groupResponse.data.members.find((member) => member.role === groupResponse.data.userRole)?.id

        if (userId) {
          await removeMember({ groupId, userId }).unwrap()
          navigate('/groups')
        }
      } catch (error) {
        console.error('Failed to leave group:', error)
      }
    }
    setLeaveDialogOpen(false)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !groupResponse?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading group details. Please try again later.</Alert>
      </Box>
    )
  }

  const { group, members } = groupResponse.data
  const libraryGames = libraryGamesResponse?.data || []
  const ownedGames = ownedGamesResponse?.data || []
  const inviteLinks = inviteLinksResponse?.data || []

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          { label: group.Name, active: true },
        ]}
      />

      <PageHeader
        title={group.Name}
        actions={
          <IconButton onClick={handleMenuOpen} aria-label="group actions">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {isAdmin && [
          <MenuItem key="create-event" onClick={handleMenuClose} component="a" href={`/events/new?groupId=${group.ID}`}>
            <ListItemIcon>
              <CalendarIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Event</ListItemText>
          </MenuItem>,
          <MenuItem key="create-game" onClick={handleMenuClose} component="a" href={`/games/new?groupId=${group.ID}`}>
            <ListItemIcon>
              <GamepadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Game</ListItemText>
          </MenuItem>,
          <MenuItem key="edit-group" onClick={handleMenuClose} component="a" href={`/groups/${group.ID}/edit`}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Group</ListItemText>
          </MenuItem>,
          <MenuItem key="manage-members" onClick={handleMenuClose} component="a" href={`/groups/${group.ID}/members`}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Members</ListItemText>
          </MenuItem>,
        ]}
        {/* Leave Group option (available to non-admin members) */}
        {!isAdmin && (
          <MenuItem onClick={handleLeaveGroupClick}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Leave Group</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Leave Group Confirmation Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={handleLeaveDialogClose}
        aria-labelledby="leave-group-dialog-title"
        aria-describedby="leave-group-dialog-description">
        <DialogTitle id="leave-group-dialog-title">Leave Group</DialogTitle>
        <DialogContent>
          <DialogContentText id="leave-group-dialog-description">
            Are you sure you want to leave {group.Name}? This action cannot be undone.
            {isAdmin && members.filter((m) => m.role === ROLE_ADMIN).length <= 1 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You are the last admin of this group. Leaving will mean no one can manage the group!
              </Alert>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLeaveDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLeaveGroupConfirm} color="error" autoFocus>
            Leave Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main tabs */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={mainTabValue} onChange={handleMainTabChange} aria-label="group details tabs" variant="fullWidth">
            <Tab icon={<InfoIcon />} label="Information" {...a11yProps(0)} iconPosition="start" />
            <Tab icon={<GroupIcon />} label="Members" {...a11yProps(1)} iconPosition="start" />
            <Tab icon={<GamepadIcon />} label="Games" {...a11yProps(2)} iconPosition="start" />
            {canManageInvites && <Tab icon={<LinkIcon />} label="Invites" {...a11yProps(3)} iconPosition="start" />}
          </Tabs>
        </Box>

        {/* Information Tab */}
        <TabPanel value={mainTabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <GroupInfoTab group={group} userRole={userRole} />
          </Box>
          <GroupEventsTab
            groupId={group.ID}
            userRole={userRole}
            events={eventsResponse?.data || []}
            isLoading={eventsLoading}
          />
        </TabPanel>
        {/* Events Tab */}

        {/* Members Tab */}
        <TabPanel value={mainTabValue} index={1}>
          <GroupMembersTab members={members} />
        </TabPanel>

        {/* Games Tab */}
        <TabPanel value={mainTabValue} index={2}>
          <GroupGamesTab
            userRole={userRole}
            groupId={group.ID}
            libraryGames={libraryGames}
            ownedGames={ownedGames}
            libraryLoading={libraryLoading}
            ownedLoading={ownedLoading}
          />
        </TabPanel>

        {/* Invites Tab */}
        {canManageInvites && (
          <TabPanel value={mainTabValue} index={3}>
            <GroupInvitesTab
              groupId={group.ID}
              userRole={userRole}
              inviteLinks={inviteLinks}
              onCreateInviteLink={handleCreateInviteLink}
              onUpdateInviteLinkStatus={handleUpdateInviteLinkStatus}
            />
          </TabPanel>
        )}
      </Box>
    </Box>
  )
}

export default GroupDetailsPage
