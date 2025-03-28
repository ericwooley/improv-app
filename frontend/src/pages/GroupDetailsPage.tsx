import { useParams } from 'react-router-dom'
import { useGetGroupQuery, useGetGroupLibraryGamesQuery, useGetGroupOwnedGamesQuery } from '../store/api/groupsApi'
import { PageHeader, Breadcrumb, InfoItem, formatDate, GameCard } from '../components'
import {
  Box,
  Card,
  CardHeader,
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
import { useState } from 'react'

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
      id={`game-tabpanel-${index}`}
      aria-labelledby={`game-tab-${index}`}
      {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `game-tab-${index}`,
    'aria-controls': `game-tabpanel-${index}`,
  }
}

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { data: groupResponse, isLoading, error } = useGetGroupQuery(groupId || '')
  const { data: libraryGamesResponse, isLoading: libraryLoading } = useGetGroupLibraryGamesQuery(groupId || '')
  const { data: ownedGamesResponse, isLoading: ownedLoading } = useGetGroupOwnedGamesQuery(groupId || '')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [tabValue, setTabValue] = useState(0)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
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
        subtitle={group.Description}
        actions={
          <IconButton onClick={handleMenuOpen} aria-label="group actions">
            <MoreVertIcon />
          </IconButton>
        }
      />
      {userRole === 'admin' && (
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
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box sx={{ flex: 1 }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader avatar={<InfoIcon />} title="Group Information" />
            <CardContent>
              <Stack spacing={2}>
                <InfoItem icon={<CalendarIcon />}>Created {formatDate(new Date(group.CreatedAt))}</InfoItem>
                <InfoItem icon={<SecurityIcon />}>Your Role: {userRole}</InfoItem>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardHeader avatar={<GroupIcon />} title="Members" />
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

          <Card>
            <CardHeader avatar={<GamepadIcon />} title="Games" />
            <CardContent sx={{ pb: 0 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="game tabs" variant="fullWidth">
                  <Tab icon={<LibraryIcon fontSize="small" />} label="Library" {...a11yProps(0)} iconPosition="start" />
                  <Tab
                    icon={<OwnedIcon fontSize="small" />}
                    label="Owned Games"
                    {...a11yProps(1)}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              <TabPanel value={tabValue} index={0}>
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

              <TabPanel value={tabValue} index={1}>
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
                    <Typography color="text.secondary">No owned games yet. Create a game for this group!</Typography>
                  </Box>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default GroupDetailsPage
