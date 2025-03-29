import { useParams, useSearchParams } from 'react-router-dom'
import { useGetGroupQuery, useGetGroupLibraryGamesQuery, useGetGroupOwnedGamesQuery } from '../store/api/groupsApi'
import { PageHeader, Breadcrumb, InfoItem, formatDate, GameCard } from '../components'
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Typography,
  Grid,
} from '@mui/material'
import {
  Info as InfoIcon,
  Group as GroupIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  CalendarMonth as CalendarIcon,
  SportsEsports as GamepadIcon,
  People as PeopleIcon,
  Bookmarks as LibraryIcon,
  Inventory as OwnedIcon,
  Security as SecurityIcon,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'

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
      id={`section-tabpanel-${index}`}
      aria-labelledby={`section-tab-${index}`}
      {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `section-tab-${index}`,
    'aria-controls': `section-tabpanel-${index}`,
  }
}

// Enum for tab values that correspond to URL params
enum TabValue {
  Info = 'info',
  Members = 'members',
  Games = 'games',
}

// Map numeric index to tab value
const indexToTabValue: Record<number, TabValue> = {
  0: TabValue.Info,
  1: TabValue.Members,
  2: TabValue.Games,
}

// Map tab value to numeric index
const tabValueToIndex: Record<string, number> = {
  [TabValue.Info]: 0,
  [TabValue.Members]: 1,
  [TabValue.Games]: 2,
}

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: groupResponse, isLoading, error } = useGetGroupQuery(groupId || '')
  const { data: libraryGamesResponse, isLoading: libraryLoading } = useGetGroupLibraryGamesQuery(groupId || '')
  const { data: ownedGamesResponse, isLoading: ownedLoading } = useGetGroupOwnedGamesQuery(groupId || '')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Get tab from URL params or default to info
  const tabFromUrl = searchParams.get('tab') || TabValue.Info
  const [mainTabValue, setMainTabValue] = useState(tabValueToIndex[tabFromUrl] || 0)

  // Games subtabs state
  const [gamesTabValue, setGamesTabValue] = useState(0)

  // Sync URL when tab changes
  useEffect(() => {
    const currentTabValue = indexToTabValue[mainTabValue]
    if (searchParams.get('tab') !== currentTabValue) {
      setSearchParams({ tab: currentTabValue })
    }
  }, [mainTabValue, searchParams, setSearchParams])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleMainTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setMainTabValue(newValue)
  }

  const handleGamesTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setGamesTabValue(newValue)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !groupResponse?.data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error loading group details. Please try again later.</Alert>
      </Box>
    )
  }

  const { group, members, userRole } = groupResponse.data
  const isAdmin = userRole === 'admin'
  const libraryGames = libraryGamesResponse?.data || []
  const ownedGames = ownedGamesResponse?.data || []

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          { label: group.Name, active: true },
        ]}
      />

      <PageHeader
        title={group.Name}
        actions={
          isAdmin && (
            <IconButton onClick={handleMenuOpen} aria-label="group actions">
              <MoreVertIcon />
            </IconButton>
          )
        }
      />
      {isAdmin && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={handleMenuClose} component="a" href={`/events/new?groupId=${group.ID}`}>
            <ListItemIcon>
              <CalendarIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Event</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose} component="a" href={`/games/new?groupId=${group.ID}`}>
            <ListItemIcon>
              <GamepadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Create Game</ListItemText>
          </MenuItem>

          <MenuItem onClick={handleMenuClose} component="a" href={`/groups/${group.ID}/edit`}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Group</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose} component="a" href={`/groups/${group.ID}/members`}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Manage Members</ListItemText>
          </MenuItem>
        </Menu>
      )}

      {/* Main tabs */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={mainTabValue} onChange={handleMainTabChange} aria-label="group details tabs" variant="fullWidth">
            <Tab icon={<InfoIcon />} label="Information" {...a11yProps(0)} iconPosition="start" />
            <Tab icon={<GroupIcon />} label="Members" {...a11yProps(1)} iconPosition="start" />
            <Tab icon={<GamepadIcon />} label="Games" {...a11yProps(2)} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Information Tab */}
        <TabPanel value={mainTabValue} index={0}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="body1">{group.Description}</Typography>
                <InfoItem icon={<CalendarIcon />}>Created {formatDate(new Date(group.CreatedAt))}</InfoItem>
                <InfoItem icon={<SecurityIcon />}>Your Role: {userRole}</InfoItem>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Members Tab */}
        <TabPanel value={mainTabValue} index={1}>
          <Card>
            <CardContent>
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>{`${member.firstName} ${member.lastName}`}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Chip label={member.role} color={member.role === 'admin' ? 'error' : 'info'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Games Tab */}
        <TabPanel value={mainTabValue} index={2}>
          <Card>
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={gamesTabValue} onChange={handleGamesTabChange} aria-label="game tabs" variant="fullWidth">
                  <Tab icon={<LibraryIcon fontSize="small" />} label="Library" {...a11yProps(0)} iconPosition="start" />
                  <Tab
                    icon={<OwnedIcon fontSize="small" />}
                    label="Group Games"
                    {...a11yProps(1)}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              <TabPanel value={gamesTabValue} index={0}>
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
                {ownedLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : ownedGames.length > 0 ? (
                  <Grid container spacing={2}>
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
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      This group hasn't added any games yet. Contact an organizer to add some games!
                    </Typography>
                  </Box>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </Box>
  )
}

export default GroupDetailsPage
