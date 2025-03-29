import React, { useState } from 'react'
import { Box, Card, CardContent, Tabs, Tab, Typography, Grid, CircularProgress, CardActionArea } from '@mui/material'
import { Bookmarks as LibraryIcon, Inventory as OwnedIcon, Add as AddIcon } from '@mui/icons-material'
import { GameCard, Game } from '..'

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

const GroupGamesTab: React.FC<GroupGamesTabProps> = ({
  libraryGames,
  ownedGames,
  libraryLoading,
  ownedLoading,
  userRole,
  groupId,
}) => {
  const [gamesTabValue, setGamesTabValue] = useState(0)
  const isAdminOrOrganizer = userRole === 'admin' || userRole === 'organizer'

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

          {libraryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : libraryGames.length > 0 ? (
            <Grid container spacing={2}>
              {libraryGames.map((game) => (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                  key={game.id}>
                  <GameCard game={game} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No games in library. Add some games to get started!</Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={gamesTabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Group Games are created and owned by this specific group. These are original games that the group has
              developed or customized for their own use.
            </Typography>
          </Box>

          {ownedLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {isAdminOrOrganizer && groupId && (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
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
              )}
              {ownedGames.map((game) => (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                  key={game.id}>
                  <GameCard game={game} />
                </Grid>
              ))}
            </Grid>
          )}
          {!ownedLoading && ownedGames.length === 0 && !isAdminOrOrganizer && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                This group hasn't added any games yet. Contact an organizer to add some games!
              </Typography>
            </Box>
          )}
          {!ownedLoading && ownedGames.length === 0 && isAdminOrOrganizer && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                This group hasn't added any games yet. Use the card above to add your first game!
              </Typography>
            </Box>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  )
}

export default GroupGamesTab
