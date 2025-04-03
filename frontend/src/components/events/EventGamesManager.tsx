import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  Alert,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { GamesListWithFilters } from '../games/GamesListWithFilters'
import GameCard from '../GameCard'
import { AnimatePresence, motion } from 'framer-motion'
import {
  useGetEventGamesQuery,
  useAddEventGameMutation,
  useRemoveEventGameMutation,
  useUpdateEventGameOrderMutation,
} from '../../store/api/eventsApi'

interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  orderIndex: number
  animationDirection?: 'up' | 'down' | null
}

interface EventGamesManagerProps {
  groupId: string
  isMC: boolean
}

// Tab panel component for mobile view
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-games-tabpanel-${index}`}
      aria-labelledby={`event-games-tab-${index}`}
      {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `event-games-tab-${index}`,
    'aria-controls': `event-games-tabpanel-${index}`,
  }
}

export const EventGamesManager = ({ groupId, isMC }: EventGamesManagerProps) => {
  const { eventId } = useParams<{ eventId: string }>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // URL sync for tabs
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab-event-games') ? parseInt(searchParams.get('tab-event-games') || '0') : 0
  const [tabValue, setTabValue] = useState(initialTab)

  useEffect(() => {
    if (isMobile) {
      searchParams.set('tab-event-games', tabValue.toString())
      setSearchParams(searchParams)
    }
  }, [tabValue, setSearchParams, searchParams, isMobile])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // API hooks
  const {
    data: eventGamesResponse,
    isLoading: isLoadingGames,
    refetch: refetchEventGames,
  } = useGetEventGamesQuery(eventId || '')

  const [addEventGame] = useAddEventGameMutation()
  const [removeEventGame] = useRemoveEventGameMutation()
  const [updateGameOrder] = useUpdateEventGameOrderMutation()

  // Event games from API
  const eventGames: Game[] = eventGamesResponse?.data?.games || []

  // Extract game IDs for filtering
  const eventGameIds = eventGames.map((game) => game.id)

  // Add game to event
  const handleAddGame = async (gameId: string) => {
    if (!eventId) return

    try {
      await addEventGame({
        eventId,
        gameId,
      }).unwrap()
      refetchEventGames()
    } catch (error) {
      console.error('Failed to add game to event:', error)
    }
  }

  // Remove game from event
  const handleRemoveGame = async (gameId: string) => {
    if (!eventId) return

    try {
      await removeEventGame({
        eventId,
        gameId,
      }).unwrap()
      refetchEventGames()
    } catch (error) {
      console.error('Failed to remove game from event:', error)
    }
  }

  // Move game up in order
  const handleMoveUp = async (game: Game, index: number) => {
    if (index === 0 || !eventId) return

    try {
      // Set a temporary direction attribute for animation
      const updatedGames = [...eventGames]
      updatedGames[index] = { ...updatedGames[index], animationDirection: 'up' as const }
      updatedGames[index - 1] = { ...updatedGames[index - 1], animationDirection: 'down' as const }

      await updateGameOrder({
        eventId,
        gameId: game.id,
        newIndex: game.orderIndex - 1,
      }).unwrap()
      refetchEventGames()
    } catch (error) {
      console.error('Failed to update game order:', error)
    }
  }

  // Move game down in order
  const handleMoveDown = async (game: Game, index: number) => {
    if (index === eventGames.length - 1 || !eventId) return

    try {
      // Set a temporary direction attribute for animation
      const updatedGames = [...eventGames]
      updatedGames[index] = { ...updatedGames[index], animationDirection: 'down' as const }
      updatedGames[index + 1] = { ...updatedGames[index + 1], animationDirection: 'up' as const }

      await updateGameOrder({
        eventId,
        gameId: game.id,
        newIndex: game.orderIndex + 1,
      }).unwrap()
      refetchEventGames()
    } catch (error) {
      console.error('Failed to update game order:', error)
    }
  }

  // Render event games list
  const renderEventGamesList = () => {
    if (isLoadingGames) {
      return <Typography>Loading games...</Typography>
    }

    if (eventGames.length === 0) {
      return <Alert severity="info">No games added to this event yet.</Alert>
    }

    return (
      <Grid container spacing={2}>
        <AnimatePresence mode="popLayout">
          {eventGames.map((game, index) => {
            // Determine animation values based on direction
            const yInitial = game.animationDirection === 'up' ? 20 : game.animationDirection === 'down' ? -20 : 20
            const yExit = game.animationDirection === 'up' ? -20 : game.animationDirection === 'down' ? 20 : -20

            return (
              <Grid
                size={12}
                key={game.id}
                component={motion.div}
                layout
                initial={{ opacity: 0, y: yInitial }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: yExit }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 300,
                  delay: game.animationDirection ? 0 : index * 0.05, // Add staggered delay only for initial load
                }}>
                <Box sx={{ position: 'relative' }}>
                  <GameCard game={game} showViewButton={true} />
                  {isMC && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(game, index)}
                        sx={{ bgcolor: 'background.paper' }}>
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === eventGames.length - 1}
                        onClick={() => handleMoveDown(game, index)}
                        sx={{ bgcolor: 'background.paper' }}>
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveGame(game.id)}
                        sx={{ bgcolor: 'background.paper' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Grid>
            )
          })}
        </AnimatePresence>
      </Grid>
    )
  }

  // Mobile view with tabs
  const renderMobileView = () => {
    if (!isMC) {
      return (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            These games will be played during the event in the order shown below.
          </Typography>
          {renderEventGamesList()}
        </>
      )
    }

    return (
      <>
        <Typography variant="body2" color="text.secondary" paragraph>
          As the MC for this event, you can manage which games will be played and their order.
        </Typography>

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="event games tabs" variant="fullWidth">
              <Tab label="Group Game Library" {...a11yProps(0)} />
              <Tab label="Event Game Lineup" {...a11yProps(1)} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Group Game Library
            </Typography>
            {renderLibraryGames()}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Event Game Lineup
            </Typography>
            {renderEventGamesList()}
          </TabPanel>
        </Box>
      </>
    )
  }

  // Desktop view with side-by-side layout
  const renderDesktopView = () => {
    if (!isMC) {
      return (
        <>
          <Typography variant="body2" color="text.secondary" paragraph>
            These games will be played during the event in the order shown below.
          </Typography>
          {renderEventGamesList()}
        </>
      )
    }

    return (
      <>
        <Typography variant="body2" color="text.secondary" paragraph>
          As the MC for this event, you can manage which games will be played and their order.
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
          {/* Left side: Available games */}
          <Paper
            elevation={2}
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 2,
            }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Group Library Games
            </Typography>
            {renderLibraryGames()}
          </Paper>

          {/* Right side: Games list */}
          <Paper
            elevation={2}
            sx={{
              flex: 1,
              p: 2,
              borderRadius: 2,
            }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Event Game Lineup
            </Typography>
            {renderEventGamesList()}
          </Paper>
        </Box>
      </>
    )
  }

  // Render the group library games
  const renderLibraryGames = () => {
    const emptyLibraryMessage = (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No remaining games in your library
        </Typography>
        <Typography variant="body1" paragraph>
          You've already added all games from your library to this event or your library is empty.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Button variant="contained" component={Link} to={`/games/new?groupId=${groupId}`} startIcon={<AddIcon />}>
            Create a New Game
          </Button>
          <Button variant="outlined" component={Link} to="/games">
            Browse Public Games
          </Button>
        </Box>
      </Box>
    )

    return (
      <Box sx={{ border: '1px solid #eee', borderRadius: 1 }}>
        <GamesListWithFilters
          groupLibrary={groupId}
          onAddGame={handleAddGame}
          excludeIds={eventGameIds}
          customEmptyState={emptyLibraryMessage}
        />
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {isMC ? 'Event Games Manager' : 'Event Games'}
      </Typography>

      {isMobile ? renderMobileView() : renderDesktopView()}
    </Paper>
  )
}
