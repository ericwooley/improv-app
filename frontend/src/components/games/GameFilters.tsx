import { FormControl, InputLabel, MenuItem, Paper, Select, SelectChangeEvent } from '@mui/material'
import { useFetchAllowedTagsQuery } from '../../store/api/gamesApi'

interface GameFiltersProps {
  selectedTag: string
  onTagChange: (tag: string) => void
}

export const GameFilters = ({ selectedTag, onTagChange }: GameFiltersProps) => {
  const { data: tagsData, isLoading: tagsLoading } = useFetchAllowedTagsQuery()
  const tags = tagsData?.data || []
  const allTags = ['All Tags', ...tags]

  const handleTagChange = (event: SelectChangeEvent) => {
    onTagChange(event.target.value)
  }

  if (tagsLoading || tags.length === 0) {
    return null
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }} data-testid="game-filters-container">
      <FormControl fullWidth>
        <InputLabel id="tag-select-label">Filter by tag</InputLabel>
        <Select
          labelId="tag-select-label"
          id="tag-select"
          value={selectedTag}
          label="Filter by tag"
          onChange={handleTagChange}
          data-testid="game-filters-tag-select">
          {allTags.map((tag) => (
            <MenuItem
              key={tag}
              value={tag}
              data-testid={`game-filters-tag-option-${tag.toLowerCase().replace(/\s+/g, '-')}`}>
              {tag}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Paper>
  )
}
