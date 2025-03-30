import { Box, CircularProgress, Grid, Typography } from '@mui/material'
import { useGetGamesQuery } from '../../store/api/gamesApi'
import { EmptyState, GameCard } from '../../components'

interface GamesListProps {
  selectedTag: string
  onClearFilter: () => void
}

export const GamesList = ({ selectedTag, onClearFilter }: GamesListProps) => {
  const {
    data: gamesData,
    isLoading,
    error,
  } = useGetGamesQuery(selectedTag !== 'All Tags' ? { tag: selectedTag } : undefined)

  const games = gamesData?.data || []

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
    return (
      <EmptyState
        message={
          selectedTag !== 'All Tags' ? `No games found with tag '${selectedTag}'` : 'No games have been added yet.'
        }
        actionText={selectedTag !== 'All Tags' ? 'Clear Filter' : 'Add Your First Game'}
        actionLink={selectedTag !== 'All Tags' ? undefined : '/games/new'}
        actionIcon={selectedTag !== 'All Tags' ? 'fas fa-times' : 'fas fa-plus'}
        onActionClick={selectedTag !== 'All Tags' ? onClearFilter : undefined}
      />
    )
  }

  return (
    <Grid container spacing={3}>
      {games.map((game) => (
        <Grid
          size={{
            xs: 12,
          }}
          key={game.id}>
          <GameCard game={game} />
        </Grid>
      ))}
    </Grid>
  )
}
