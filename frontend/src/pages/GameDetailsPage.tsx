import {
  Box,
  CircularProgress,
  Button,
  Alert,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
import { useState, useEffect } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

// Component to manage group libraries
const GroupLibraryManager = ({ gameId }: { gameId: string }) => {
  const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery()
  const { data: gameLibrariesData, isLoading: librariesLoading } = useGetGameGroupLibrariesQuery(gameId)
  const [adminGroups, setAdminGroups] = useState<Array<{ ID: string; Name: string; userRole: string }>>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [addGameToLibrary] = useAddGameToLibraryMutation()
  const [removeGameFromLibrary] = useRemoveGameFromLibraryMutation()

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

  // Get the list of group IDs that have this game in their library
  useEffect(() => {
    if (gameLibrariesData?.data) {
      const groupsWithThisGame = gameLibrariesData.data.map((group) => group.id)
      setSelectedGroups(groupsWithThisGame)
    }
  }, [gameLibrariesData])

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) => {
      if (prev.includes(groupId)) {
        return prev.filter((id) => id !== groupId)
      } else {
        return [...prev, groupId]
      }
    })
  }

  const handleSave = async () => {
    if (!gameId) return

    try {
      // Get current groups with this game
      const currentGroupsWithGame = gameLibrariesData?.data?.map((group) => group.id) || []

      // For each admin group, check if it should have the game
      for (const group of adminGroups) {
        const shouldHaveGame = selectedGroups.includes(group.ID)
        const alreadyHasGame = currentGroupsWithGame.includes(group.ID)

        if (shouldHaveGame && !alreadyHasGame) {
          // Add game to library
          await addGameToLibrary({ groupId: group.ID, gameId })
        } else if (!shouldHaveGame && alreadyHasGame) {
          // Remove game from library
          await removeGameFromLibrary({ groupId: group.ID, gameId })
        }
      }

      // Show success feedback
      alert('Group libraries updated successfully')
    } catch (error) {
      console.error('Error updating group libraries:', error)
      alert('Failed to update group libraries')
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
        <FormControl component="fieldset">
          <FormGroup>
            {adminGroups.map((group) => (
              <FormControlLabel
                key={group.ID}
                control={
                  <Checkbox checked={selectedGroups.includes(group.ID)} onChange={() => handleGroupToggle(group.ID)} />
                }
                label={`${group.Name} (${group.userRole})`}
              />
            ))}
          </FormGroup>
        </FormControl>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
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
