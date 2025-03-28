import { useState } from 'react'
import { Box, Typography, Grid, CardActions } from '@mui/material'
import { PageHeader, ItemCard, EmptyState, ActionButton, TagList, InfoItem } from '../components'

interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  tags: string[]
}

interface GamesPageProps {
  initialGames?: Game[]
}

const GamesPage = ({ initialGames = [] }: GamesPageProps) => {
  const [games] = useState<Game[]>(initialGames)

  return (
    <Box>
      <PageHeader title="Improv Games" subtitle="Browse and manage your collection of improv games" />

      {games.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <ActionButton text="Create Game" to="/games/new" icon="fas fa-plus" />
        </Box>
      )}

      {/* Games Grid */}
      {games.length > 0 ? (
        <Grid container spacing={3}>
          {games.map((game) => (
            <Grid key={game.id} size={4}>
              <ItemCard id={game.id} title={game.name} description={game.description} footerLink={`/games/${game.id}`}>
                <InfoItem icon="fas fa-users">
                  <Typography variant="body2">
                    {game.minPlayers}-{game.maxPlayers} players
                  </Typography>
                </InfoItem>

                <TagList tags={game.tags} />

                <CardActions sx={{ pt: 2, justifyContent: 'space-between' }}>
                  <ActionButton
                    text="View"
                    to={`/games/${game.id}`}
                    variant="outlined"
                    color="primary"
                    icon="fas fa-eye"
                  />
                  <ActionButton text="Delete" variant="outlined" color="error" icon="fas fa-trash" />
                </CardActions>
              </ItemCard>
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState
          message="No games have been added yet."
          actionText="Add Your First Game"
          actionLink="/games/new"
          actionIcon="fas fa-plus"
        />
      )}
    </Box>
  )
}

export default GamesPage
