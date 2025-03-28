import {
  Box,
  CircularProgress,
  Button,
  Alert,
  FormControl,
  FormGroup,
  FormControlLabel,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader, Breadcrumb } from '../components'
import GameCard from '../components/GameCard'
import { useGetGameQuery, useGetGameGroupLibrariesQuery } from '../store/api/gamesApi'
import {
  useGetGroupsQuery,
  useAddGameToLibraryMutation,
  useRemoveGameFromLibraryMutation,
} from '../store/api/groupsApi'
import { useState, useEffect, useCallback } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'

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
          if (details.data?.userRole === 'admin' || details.data?.userRole === 'organizer') {
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
    <Accordion sx={{ mb: 3 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="group-libraries-content"
        id="group-libraries-header">
        <Typography variant="h6">Manage Group Libraries</Typography>
      </AccordionSummary>
      <AccordionDetails>
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
      </AccordionDetails>
    </Accordion>
  )
}

const GameDetailsPage = () => {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const { data: gameData, isLoading, error } = useGetGameQuery(gameId || '')

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

      <PageHeader title="Game Details" subtitle="" />

      {gameId && <GroupLibraryManager gameId={gameId} />}

      <GameCard game={game} showViewButton={false} />
    </Box>
  )
}

export default GameDetailsPage
