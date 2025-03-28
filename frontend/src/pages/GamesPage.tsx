import {
  Box,
  Typography,
  CardActions,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
} from '@mui/material'
import { PageHeader, EmptyState, TagList, InfoItem } from '../components'
import { useGetGamesQuery } from '../store/api/gamesApi'
import { Link } from 'react-router-dom'

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
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardHeader title={game.name} />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {game.description}
                  </Typography>

                  <InfoItem icon="fas fa-users">
                    <Typography variant="body2">
                      {game.minPlayers}-{game.maxPlayers} players
                    </Typography>
                  </InfoItem>

                  {game.public && (
                    <InfoItem icon="fas fa-globe">
                      <Typography variant="body2" color="primary.main">
                        Public
                      </Typography>
                    </InfoItem>
                  )}

                  <TagList tags={game.tags} />
                </CardContent>

                <CardActions sx={{ pt: 2, justifyContent: 'flex-end' }}>
                  <Button component={Link} to={`/games/${game.id}`} color="primary" size="small">
                    View
                  </Button>
                </CardActions>
              </Card>
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
