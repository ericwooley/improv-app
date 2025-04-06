import { Box } from '@mui/material'
import { GameFilters } from './GameFilters'
import { GamesList } from './GamesList'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ReactNode } from 'react'
import { TextField, InputAdornment, IconButton, Button } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

interface GamesListWithFiltersProps {
  groupLibrary?: string
  groupOwner?: string
  onGameSelect?: (gameId: string) => void
  selectedGameId?: string | null
  excludeIds?: string[]
  customEmptyState?: ReactNode
  onAddGame?: (gameId: string) => void
}

export const GamesListWithFilters = ({
  groupLibrary,
  groupOwner,
  onGameSelect,
  selectedGameId,
  excludeIds,
  customEmptyState,
  onAddGame,
}: GamesListWithFiltersProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || 'All Tags')
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '')
  const [inputValue, setInputValue] = useState<string>(searchParams.get('search') || '')

  // Update URL when selected tag or search query changes
  useEffect(() => {
    if (selectedTag && selectedTag !== 'All Tags') {
      searchParams.set('tag', selectedTag)
    } else {
      searchParams.delete('tag')
    }

    // Add search query to URL if provided
    if (searchQuery) {
      searchParams.set('search', searchQuery)
    } else {
      searchParams.delete('search')
    }

    // Add group library filter to URL if provided
    if (groupLibrary) {
      searchParams.set('library', groupLibrary)
    } else {
      searchParams.delete('library')
    }

    // Add group owner filter to URL if provided
    if (groupOwner) {
      searchParams.set('ownedByGroup', groupOwner)
    } else {
      searchParams.delete('ownedByGroup')
    }

    setSearchParams(searchParams)
  }, [selectedTag, searchQuery, searchParams, setSearchParams, groupLibrary, groupOwner])

  const handleTagChange = (newTag: string) => {
    setSelectedTag(newTag)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  const handleSearch = () => {
    setSearchQuery(inputValue)
  }

  const clearSearch = () => {
    setInputValue('')
    setSearchQuery('')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    handleSearch()
  }

  return (
    <Box>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Search games..."
          value={inputValue}
          onChange={handleInputChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: inputValue ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        <Button variant="contained" color="primary" type="submit" sx={{ minWidth: '100px' }}>
          Search
        </Button>
      </Box>
      <GameFilters selectedTag={selectedTag} onTagChange={handleTagChange} />
      <GamesList
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        onClearFilter={() => {
          handleTagChange('All Tags')
          clearSearch()
        }}
        groupLibrary={groupLibrary}
        groupOwner={groupOwner}
        onGameSelect={onGameSelect}
        selectedGameId={selectedGameId}
        excludeIds={excludeIds}
        customEmptyState={customEmptyState}
        onAddGame={onAddGame}
      />
    </Box>
  )
}
