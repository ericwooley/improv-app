import React, { useState, useEffect } from 'react'
import { Box, Card, CardContent, Tabs, Tab, Typography, Grid, CardActionArea } from '@mui/material'
import { Bookmarks as LibraryIcon, Inventory as OwnedIcon, Add as AddIcon } from '@mui/icons-material'
import { Game } from '..'
import { GamesListWithFilters } from '../games/GamesListWithFilters'
import { useSearchParams } from 'react-router-dom'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`games-tabpanel-${index}`}
      aria-labelledby={`games-tab-${index}`}
      {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `games-tab-${index}`,
    'aria-controls': `games-tabpanel-${index}`,
  }
}

interface GroupGamesTabProps {
  libraryGames: Game[]
  ownedGames: Game[]
  libraryLoading: boolean
  ownedLoading: boolean
  userRole: string
  groupId: string
}

const GroupGamesTab: React.FC<GroupGamesTabProps> = ({ userRole, groupId }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab-group-games') ? parseInt(searchParams.get('tab-group-games') || '0') : 0
  const [gamesTabValue, setGamesTabValue] = useState(initialTab)
  const isAdminOrOrganizer = userRole === 'admin' || userRole === 'organizer'

  useEffect(() => {
    searchParams.set('tab-group-games', gamesTabValue.toString())
    setSearchParams(searchParams)
  }, [gamesTabValue, setSearchParams, searchParams])

  const handleGamesTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setGamesTabValue(newValue)
  }

  return (
    <Card>
      <CardContent sx={{ pb: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={gamesTabValue} onChange={handleGamesTabChange} aria-label="game tabs" variant="fullWidth">
            <Tab icon={<LibraryIcon fontSize="small" />} label="Library" {...a11yProps(0)} iconPosition="start" />
            <Tab icon={<OwnedIcon fontSize="small" />} label="Group Games" {...a11yProps(1)} iconPosition="start" />
          </Tabs>
        </Box>

        <TabPanel value={gamesTabValue} index={0}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Library games are saved to this group's collection for easy access. These can include public games or
              games from other groups that members have added to this group's library.
            </Typography>
          </Box>

          <GamesListWithFilters groupLibrary={groupId} />
        </TabPanel>

        <TabPanel value={gamesTabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Group Games are created and owned by this specific group. These are original games that the group has
              developed or customized for their own use.
            </Typography>
          </Box>

          {isAdminOrOrganizer && groupId && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid
                size={{
                  xs: 12,
                }}
                key="add-game-card">
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    bgcolor: 'background.paper',
                  }}>
                  <CardActionArea
                    component="a"
                    href={`/games/new?groupId=${groupId}`}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      height: '100%',
                    }}>
                    <AddIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                    <Typography variant="h6" color="primary" align="center">
                      Add New Game
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          )}

          <GamesListWithFilters groupOwner={groupId} />
        </TabPanel>
      </CardContent>
    </Card>
  )
}

export default GroupGamesTab
