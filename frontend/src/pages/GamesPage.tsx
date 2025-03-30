import { Box } from '@mui/material'
import { PageHeader } from '../components'
import { GamesListWithFilters } from '../components/games/GamesListWithFilters'

const GamesPage = () => {
  return (
    <Box>
      <PageHeader title="Improv Games" subtitle="Browse and manage your collection of improv games" />
      <GamesListWithFilters />
    </Box>
  )
}

export default GamesPage
