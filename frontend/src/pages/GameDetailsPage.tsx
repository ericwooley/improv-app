import {
  Box,
  CircularProgress,
  Button,
  Alert,
  FormControl,
  FormGroup,
  FormControlLabel,
  Typography,
  Switch,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, Breadcrumb, TabPanel, a11yProps } from '../components'
import GameCard, { Game } from '../components/GameCard'
import { useGetGameQuery, useGetGameGroupLibrariesQuery } from '../store/api/gamesApi'
import {
  useGetGroupsQuery,
  useAddGameToLibraryMutation,
  useRemoveGameFromLibraryMutation,
} from '../store/api/groupsApi'
import { useState, useEffect, useCallback } from 'react'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import EditIcon from '@mui/icons-material/Edit'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { isAdminRole } from '../constants/roles'

// Define tab values for URL sync
enum TabValue {
  Details = 'details',
  Libraries = 'libraries',
}

const tabValueToIndex: Record<string, number> = {
  [TabValue.Details]: 0,
  [TabValue.Libraries]: 1,
}

const indexToTabValue: Record<number, string> = {
  0: TabValue.Details,
  1: TabValue.Libraries,
}

// Component to manage group libraries
const GroupLibraryManager = ({ gameId }: { gameId: string }) => {
  const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery()
  const {
    data: gameLibrariesData,
    isLoading: librariesLoading,
    refetch: refetchLibraries,
  } = useGetGameGroupLibrariesQuery(gameId)
  const [adminGroups, setAdminGroups] = useState<Array<{ ID: string; Name: string; userRole: string }>>([])
  const [addGameToLibrary] = useAddGameToLibraryMutation()
  const [removeGameFromLibrary] = useRemoveGameFromLibraryMutation()
  const [pendingGroups, setPendingGroups] = useState<Record<string, boolean>>({})
  const [statusMessage, setStatusMessage] = useState<Record<string, { success: boolean; message: string }>>({})

  // Helper function to check if group is in library
  const isGroupInLibrary = useCallback(
    (groupId: string) => {
      if (!gameLibrariesData?.data) return false
      return gameLibrariesData.data.some((libraryGroup) => libraryGroup.id.toLowerCase() === groupId.toLowerCase())
    },
    [gameLibrariesData]
  )

  useEffect(() => {
    if (groupsData?.data) {
      // For each group, we need to fetch its details to check the user's role
      const adminOrOrganizerGroups = groupsData.data.map(async (group) => {
        try {
          const response = await fetch(`/api/groups/${group.ID}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          const details = await response.json()
          if (details.data?.userRole && isAdminRole(details.data.userRole)) {
            return { ...group, userRole: details.data.userRole }
          }
          return null
        } catch (error) {
          console.error('Error fetching group details:', error)
          return null
        }
      })

      Promise.all(adminOrOrganizerGroups).then((results) => {
        setAdminGroups(results.filter(Boolean) as Array<{ ID: string; Name: string; userRole: string }>)
      })
    }
  }, [groupsData])

  // Handle toggling a group library membership
  const handleGroupToggle = async (groupId: string, inLibrary: boolean) => {
    try {
      setPendingGroups((prev) => ({ ...prev, [groupId]: true }))
      setStatusMessage((prev) => ({ ...prev, [groupId]: { success: false, message: 'Updating...' } }))

      if (inLibrary) {
        // Remove from library
        await removeGameFromLibrary({ groupId, gameId })
        setStatusMessage((prev) => ({ ...prev, [groupId]: { success: true, message: 'Removed from library' } }))
      } else {
        // Add to library
        await addGameToLibrary({ groupId, gameId })
        setStatusMessage((prev) => ({ ...prev, [groupId]: { success: true, message: 'Added to library' } }))
      }

      // Refetch to update the lists
      await refetchLibraries()
    } catch (error) {
      console.error(`Error toggling group ${groupId}:`, error)
      setStatusMessage((prev) => ({
        ...prev,
        [groupId]: {
          success: false,
          message: 'Error updating library',
        },
      }))
    } finally {
      setPendingGroups((prev) => ({ ...prev, [groupId]: false }))

      // Clear status message after 3 seconds
      setTimeout(() => {
        setStatusMessage((prev) => {
          const newStatus = { ...prev }
          delete newStatus[groupId]
          return newStatus
        })
      }, 3000)
    }
  }

  if (groupsLoading || librariesLoading) return <CircularProgress size={24} />

  if (!adminGroups.length) return null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Manage Group Libraries
      </Typography>
      <FormControl component="fieldset" fullWidth>
        <FormGroup>
          {adminGroups.map((group) => {
            const inLibrary = isGroupInLibrary(group.ID)
            const isPending = pendingGroups[group.ID]
            const status = statusMessage[group.ID]

            return (
              <Box
                key={group.ID}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: '1px solid #eee',
                }}>
                <Typography>
                  {group.Name}{' '}
                  <Typography component="span" color="text.secondary">
                    ({group.userRole})
                  </Typography>
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {status && (
                    <Tooltip title={status.message}>
                      <IconButton size="small" color={status.success ? 'success' : 'error'}>
                        {status.success ? <CheckCircleIcon fontSize="small" /> : <ErrorIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  )}

                  {isPending ? (
                    <CircularProgress size={24} />
                  ) : (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={inLibrary}
                          onChange={() => handleGroupToggle(group.ID, inLibrary)}
                          color="primary"
                        />
                      }
                      label={inLibrary ? 'In Library' : 'Not In Library'}
                      labelPlacement="start"
                      sx={{ ml: 0, mr: 0 }}
                    />
                  )}
                </Box>
              </Box>
            )
          })}
        </FormGroup>
      </FormControl>
    </Box>
  )
}

// Game Details Tab content
const GameDetailsTab = ({ game }: { game: Game }) => {
  return <GameCard game={game} showViewButton={false} />
}

// Read-only view for libraries
const ReadOnlyLibraries = ({ gameId }: { gameId: string }) => {
  const { data: gameLibrariesData, isLoading } = useGetGameGroupLibrariesQuery(gameId)

  if (isLoading) {
    return <CircularProgress size={24} />
  }

  const libraries = gameLibrariesData?.data || []

  if (libraries.length === 0) {
    return (
      <Box sx={{ my: 2 }}>
        <Alert severity="info">This game is not in any group libraries.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" gutterBottom>
        This game is in the following group libraries:
      </Typography>
      {libraries.map((group) => (
        <Box
          key={group.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            mb: 1,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}>
          <Typography>{group.name}</Typography>
        </Box>
      ))}
    </Box>
  )
}

// Libraries Tab content with role-based access
const LibrariesTab = ({ gameId }: { gameId: string }) => {
  const { data: groupsData, isLoading } = useGetGroupsQuery()
  const [hasModifyAccess, setHasModifyAccess] = useState(false)

  useEffect(() => {
    if (groupsData?.data) {
      // Check if user has admin or organizer role in any group
      const checkAccess = async () => {
        const accessChecks = groupsData.data.map(async (group) => {
          try {
            const response = await fetch(`/api/groups/${group.ID}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            const details = await response.json()
            return details.data?.userRole && isAdminRole(details.data.userRole)
          } catch (error) {
            console.error('Error checking group access:', error)
            return false
          }
        })

        const results = await Promise.all(accessChecks)
        setHasModifyAccess(results.some(Boolean))
      }
      checkAccess()
    }
  }, [groupsData])

  if (isLoading) {
    return <CircularProgress />
  }

  return hasModifyAccess ? <GroupLibraryManager gameId={gameId} /> : <ReadOnlyLibraries gameId={gameId} />
}

const GameDetailsPage = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: gameData, isLoading, error } = useGetGameQuery(gameId || '')
  const [canEdit, setCanEdit] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)

  // Get tab from URL params or default to details
  const tabFromUrl = searchParams.get('tab-game') || TabValue.Details
  const [tabValue, setTabValue] = useState(tabValueToIndex[tabFromUrl] || 0)

  // Check if user has edit permissions
  useEffect(() => {
    const checkEditPermission = async () => {
      if (gameData?.data?.game) {
        const game = gameData.data.game
        try {
          const response = await fetch(`/api/groups/${game.groupId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          const groupData = await response.json()
          const userRole = groupData.data?.userRole
          setCanEdit(isAdminRole(userRole))
        } catch (error) {
          console.error('Error checking group access:', error)
          setCanEdit(false)
        }
      }
    }

    checkEditPermission()
  }, [gameData])

  // Sync URL when tab changes
  useEffect(() => {
    const currentTabValue = indexToTabValue[tabValue]
    if (searchParams.get('tab-game') !== currentTabValue) {
      setSearchParams({ 'tab-game': currentTabValue })
    }
  }, [tabValue, searchParams, setSearchParams, navigate, gameId])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleEditGame = () => {
    handleMenuClose()
    navigate(`/games/${gameId}/edit`)
  }

  // Extract data from response
  const game = gameData?.data?.game

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          This game is not available. You may not have permission to view it if it's not public or you're not a member
          of the group that owns it.
        </Alert>
        <Button variant="contained" color="primary" onClick={() => navigate('/games')}>
          Back to Games
        </Button>
      </Box>
    )
  }

  if (!game) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="warning">Game not found.</Alert>
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/games')}>
          Back to Games
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Breadcrumb
        items={[
          { label: 'Games', to: '/games' },
          { label: game.name || 'Game Details', active: true },
        ]}
      />

      <PageHeader
        title="Game Details"
        subtitle=""
        actions={
          canEdit && (
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVertIcon />
            </IconButton>
          )
        }
      />

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}>
        <MenuItem onClick={handleEditGame}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Game</ListItemText>
        </MenuItem>
      </Menu>

      {/* Tab navigation */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="game details tabs" variant="fullWidth">
            <Tab icon={<InfoIcon />} label="Details" {...a11yProps(0)} iconPosition="start" />
            <Tab icon={<LibraryBooksIcon />} label="Group Libraries" {...a11yProps(1)} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Details Tab */}
        <TabPanel value={tabValue} index={0}>
          <GameDetailsTab game={game} />
        </TabPanel>

        {/* Libraries Tab */}
        <TabPanel value={tabValue} index={1}>
          {gameId && (
            <Paper sx={{ p: 2 }}>
              <LibrariesTab gameId={gameId} />
            </Paper>
          )}
        </TabPanel>
      </Box>
    </Box>
  )
}

export default GameDetailsPage
