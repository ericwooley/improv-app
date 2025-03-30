import { useParams, useSearchParams } from 'react-router-dom'
import {
  useGetGroupQuery,
  useGetGroupLibraryGamesQuery,
  useGetGroupOwnedGamesQuery,
  useGetGroupInviteLinksQuery,
  useCreateGroupInviteLinkMutation,
  useUpdateGroupInviteLinkStatusMutation,
} from '../store/api/groupsApi'
import {
  PageHeader,
  Breadcrumb,
  GroupInfoTab,
  GroupMembersTab,
  GroupGamesTab,
  GroupInvitesTab,
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
} from '@mui/icons-material'
import { useState, useEffect } from 'react'

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: groupResponse, isLoading, error } = useGetGroupQuery(groupId || '')
  const { data: libraryGamesResponse, isLoading: libraryLoading } = useGetGroupLibraryGamesQuery(groupId || '')
  const { data: ownedGamesResponse, isLoading: ownedLoading } = useGetGroupOwnedGamesQuery(groupId || '')
  const { data: inviteLinksResponse } = useGetGroupInviteLinksQuery(groupId || '')
  const [createInviteLink] = useCreateGroupInviteLinkMutation()
  const [updateInviteLinkStatus] = useUpdateGroupInviteLinkStatusMutation()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

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

  const { group, members, userRole } = groupResponse.data
  const isAdmin = userRole === 'admin'
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
          isAdmin && (
            <IconButton onClick={handleMenuOpen} aria-label="group actions">
              <MoreVertIcon />
            </IconButton>
          )
        }
      />
      {isAdmin && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleMenuClose} component="a" href={`/events/new?groupId=${group.ID}`}>
            <ListItemIcon>
              <CalendarIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Event</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose} component="a" href={`/games/new?groupId=${group.ID}`}>
            <ListItemIcon>
              <GamepadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Game</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleMenuClose} component="a" href={`/groups/${group.ID}/edit`}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Group</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose} component="a" href={`/groups/${group.ID}/members`}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Members</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Main tabs */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={mainTabValue} onChange={handleMainTabChange} aria-label="group details tabs" variant="fullWidth">
            <Tab icon={<InfoIcon />} label="Information" {...a11yProps(0)} iconPosition="start" />
            <Tab icon={<GroupIcon />} label="Members" {...a11yProps(1)} iconPosition="start" />
            <Tab icon={<GamepadIcon />} label="Games" {...a11yProps(2)} iconPosition="start" />
            <Tab icon={<LinkIcon />} label="Invites" {...a11yProps(3)} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Information Tab */}
        <TabPanel value={mainTabValue} index={0}>
          <GroupInfoTab group={group} userRole={userRole} />
        </TabPanel>

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
        <TabPanel value={mainTabValue} index={3}>
          <GroupInvitesTab
            groupId={group.ID}
            userRole={userRole}
            inviteLinks={inviteLinks}
            onCreateInviteLink={handleCreateInviteLink}
            onUpdateInviteLinkStatus={handleUpdateInviteLinkStatus}
          />
        </TabPanel>
      </Box>
    </Box>
  )
}

export default GroupDetailsPage
