import { Box } from '@mui/material'
import { GameFilters } from './GameFilters'
import { GamesList } from './GamesList'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

interface GamesListWithFiltersProps {
  groupLibrary?: string
  groupOwner?: string
  onGameSelect?: (gameId: string) => void
  selectedGameId?: string | null
}

export const GamesListWithFilters = ({
  groupLibrary,
  groupOwner,
  onGameSelect,
  selectedGameId,
}: GamesListWithFiltersProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || 'All Tags')

  // Update URL when selected tag changes
  useEffect(() => {
    if (selectedTag && selectedTag !== 'All Tags') {
      searchParams.set('tag', selectedTag)
    } else {
      searchParams.delete('tag')
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
  }, [selectedTag, searchParams, setSearchParams, groupLibrary, groupOwner])

  const handleTagChange = (newTag: string) => {
    setSelectedTag(newTag)
  }

  return (
    <Box>
      <GameFilters selectedTag={selectedTag} onTagChange={handleTagChange} />
      <GamesList
        selectedTag={selectedTag}
        onClearFilter={() => handleTagChange('All Tags')}
        groupLibrary={groupLibrary}
        groupOwner={groupOwner}
        onGameSelect={onGameSelect}
        selectedGameId={selectedGameId}
      />
    </Box>
  )
}
