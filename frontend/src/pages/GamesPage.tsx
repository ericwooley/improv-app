import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  SelectChangeEvent,
} from '@mui/material'
import { PageHeader, EmptyState, GameCard } from '../components'
import { useGetGamesQuery, useFetchAllowedTagsQuery } from '../store/api/gamesApi'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const GamesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || 'All Tags')

  const {
    data: gamesData,
    isLoading,
    error,
  } = useGetGamesQuery(selectedTag ? { tag: selectedTag === 'All Tags' ? '' : selectedTag } : undefined)
  const { data: tagsData, isLoading: tagsLoading } = useFetchAllowedTagsQuery()

  const games = gamesData?.data || []
  const tags = tagsData?.data || []
  const allTags = ['All Tags', ...tags]
  // Update URL when selected tag changes
  useEffect(() => {
    if (selectedTag) {
      searchParams.set('tag', selectedTag)
    } else {
      searchParams.delete('tag')
    }
    setSearchParams(searchParams)
  }, [selectedTag, searchParams, setSearchParams])

  const handleTagChange = (event: SelectChangeEvent) => {
    setSelectedTag(event.target.value)
  }

  return (
    <Box>
      <PageHeader title="Improv Games" subtitle="Browse and manage your collection of improv games" />

      {/* Tags filter */}
      {!tagsLoading && tags.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="tag-select-label">Filter by tag</InputLabel>
            <Select
              labelId="tag-select-label"
              id="tag-select"
              value={selectedTag}
              label="Filter by tag"
              onChange={handleTagChange}>
              {allTags.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

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
                sm: 12,
                md: 6,
              }}
              key={game.id}>
              <GameCard game={game} />
            </Grid>
          ))}
        </Grid>
      ) : (
        !isLoading && (
          <EmptyState
            message={selectedTag ? `No games found with tag '${selectedTag}'` : 'No games have been added yet.'}
            actionText={selectedTag ? 'Clear Filter' : 'Add Your First Game'}
            actionLink={selectedTag ? undefined : '/games/new'}
            actionIcon={selectedTag ? 'fas fa-times' : 'fas fa-plus'}
            onActionClick={selectedTag ? () => setSelectedTag('') : undefined}
          />
        )
      )}
    </Box>
  )
}

export default GamesPage
