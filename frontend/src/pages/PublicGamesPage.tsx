import { Box } from '@mui/material'
import { PageHeader } from '../components'
import { GamesListWithFilters } from '../components/games/GamesListWithFilters'

const PublicGamesPage = () => {
  return (
    <Box>
      <PageHeader title="Improv Games" subtitle="Browse our collection of public improv games" />
      <GamesListWithFilters />
    </Box>
  )
}

export default PublicGamesPage
