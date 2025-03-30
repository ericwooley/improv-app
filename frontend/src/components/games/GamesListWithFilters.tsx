import { Box } from '@mui/material'
import { GameFilters } from './GameFilters'
import { GamesList } from './GamesList'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const GamesListWithFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedTag, setSelectedTag] = useState<string>(searchParams.get('tag') || 'All Tags')

  // Update URL when selected tag changes
  useEffect(() => {
    if (selectedTag && selectedTag !== 'All Tags') {
      searchParams.set('tag', selectedTag)
    } else {
      searchParams.delete('tag')
    }
    setSearchParams(searchParams)
  }, [selectedTag, searchParams, setSearchParams])

  const handleTagChange = (newTag: string) => {
    setSelectedTag(newTag)
  }

  return (
    <Box>
      <GameFilters selectedTag={selectedTag} onTagChange={handleTagChange} />
      <GamesList selectedTag={selectedTag} onClearFilter={() => handleTagChange('All Tags')} />
    </Box>
  )
}
