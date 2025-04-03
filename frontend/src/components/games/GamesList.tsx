import { Box, CircularProgress, Grid, Typography } from '@mui/material'
import { useGetGamesQuery } from '../../store/api/gamesApi'
import { EmptyState, GameCard } from '../../components'
import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface GamesListProps {
  selectedTag: string
  onClearFilter: () => void
  groupLibrary?: string
  groupOwner?: string
  onGameSelect?: (gameId: string) => void
  selectedGameId?: string | null
  showViewButton?: boolean
  excludeIds?: string[]
  customEmptyState?: ReactNode
  onAddGame?: (gameId: string) => void
}

export const GamesList = ({
  selectedTag,
  onClearFilter,
  groupLibrary,
  groupOwner,
  showViewButton,
  onGameSelect,
  selectedGameId,
  excludeIds = [],
  customEmptyState,
  onAddGame,
}: GamesListProps) => {
  const queryParams: { tag?: string; library?: string; ownedByGroup?: string } = {}

  if (selectedTag !== 'All Tags') {
    queryParams.tag = selectedTag
  }

  if (groupLibrary) {
    queryParams.library = groupLibrary
  }

  if (groupOwner) {
    queryParams.ownedByGroup = groupOwner
  }

  const {
    data: gamesData,
    isLoading,
    error,
  } = useGetGamesQuery(Object.keys(queryParams).length > 0 ? queryParams : undefined)

  const allGames = gamesData?.data || []
  // Filter out excluded games
  const games = excludeIds.length > 0 ? allGames.filter((game) => !excludeIds.includes(game.id)) : allGames

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
        <Typography color="error">Failed to load games. Please try again later.</Typography>
      </Box>
    )
  }

  if (games.length === 0) {
    if (customEmptyState) {
      return <>{customEmptyState}</>
    }

    let message = 'No games have been added yet.'

    if (selectedTag !== 'All Tags') {
      message = `No games found with tag '${selectedTag}'`
    } else if (groupLibrary) {
      message = "No games found in this group's library"
    } else if (groupOwner) {
      message = 'No games owned by this group'
    } else if (excludeIds.length > 0) {
      message = 'All available games have been added to the event'
    }

    return (
      <EmptyState
        message={message}
        actionText={selectedTag !== 'All Tags' ? 'Clear Filter' : 'Add Your First Game'}
        actionLink={selectedTag !== 'All Tags' ? undefined : '/games/new'}
        actionIcon={selectedTag !== 'All Tags' ? 'fas fa-times' : 'fas fa-plus'}
        onActionClick={selectedTag !== 'All Tags' ? onClearFilter : undefined}
      />
    )
  }

  return (
    <Grid container spacing={3}>
      <AnimatePresence mode="popLayout">
        {games.map((game, index) => (
          <Grid
            size={{
              xs: 12,
            }}
            component={motion.div}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05, // Stagger effect based on index
              type: 'spring',
              damping: 20,
              stiffness: 300,
            }}
            key={game.id}>
            <GameCard
              game={game}
              showViewButton={showViewButton}
              onClick={onGameSelect ? () => onGameSelect(game.id) : undefined}
              isSelected={onGameSelect ? selectedGameId === game.id : undefined}
              onAddGame={onAddGame ? () => onAddGame(game.id) : undefined}
            />
          </Grid>
        ))}
      </AnimatePresence>
    </Grid>
  )
}
