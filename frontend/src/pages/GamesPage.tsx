import { Box, Typography, CircularProgress, Grid } from '@mui/material'
import { PageHeader, EmptyState, GameCard } from '../components'
import { useGetGamesQuery } from '../store/api/gamesApi'

const GamesPage = () => {
  const { data: gamesData, isLoading, error } = useGetGamesQuery()
  const games = gamesData?.data || []

  return (
    <Box>
      <PageHeader title="Improv Games" subtitle="Browse and manage your collection of improv games" />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Box sx={{ my: 4 }}>
          <Typography color="error">Failed to load games. Please try again later.</Typography>
        </Box>
      )}

      {/* Games Grid */}
      {!isLoading && games.length > 0 ? (
        <Grid container spacing={3}>
          {games.map((game) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4,
              }}
              key={game.id}>
              <GameCard game={game} />
            </Grid>
          ))}
        </Grid>
      ) : (
        !isLoading && (
          <EmptyState
            message="No games have been added yet."
            actionText="Add Your First Game"
            actionLink="/games/new"
            actionIcon="fas fa-plus"
          />
        )
      )}
    </Box>
  )
}

export default GamesPage
