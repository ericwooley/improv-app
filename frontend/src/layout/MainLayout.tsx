import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { clearCredentials } from '../store/slices/authSlice'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  SportsEsports as GamesIcon,
  Group as GroupIcon,
  Event as EventIcon,
} from '@mui/icons-material'

interface MainLayoutProps {
  children: React.ReactNode
}

const drawerWidth = 250

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleLogout = async () => {
    try {
      dispatch(clearCredentials())
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const menuItems = isAuthenticated
    ? [
        { text: 'Home', icon: <HomeIcon />, path: '/' },
        { text: 'Games', icon: <GamesIcon />, path: '/games' },
        { text: 'Groups', icon: <GroupIcon />, path: '/groups' },
        { text: 'Events', icon: <EventIcon />, path: '/events' },
        { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
      ]
    : [
        { text: 'Home', icon: <HomeIcon />, path: '/' },
        { text: 'Login', icon: <LoginIcon />, path: '/login' },
        { text: 'Register', icon: <PersonAddIcon />, path: '/register' },
      ]

  const drawer = (
    <Box sx={{ width: drawerWidth }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <img src="/logo.png" alt="ImprovHQ" style={{ width: 32, height: 32 }} />
        <Typography variant="h6" color="white">
          ImprovHQ
        </Typography>
      </Box>
      <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
      <List sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            onClick={() => setIsSidebarOpen(false)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderLeft: '4px solid #3498db',
              },
            }}>
            <ListItemIcon sx={{ color: 'white', opacity: 0.9 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} sx={{ color: 'white', opacity: 0.9 }} />
          </ListItemButton>
        ))}
      </List>
      {isAuthenticated && (
        <>
          <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
          <Box sx={{ p: 2 }}>
            <Button variant="outlined" color="error" fullWidth startIcon={<LogoutIcon />} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: 'secondary.main',
          }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={() => setIsSidebarOpen(!isSidebarOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img src="/logo.png" alt="ImprovHQ" style={{ width: 32, height: 32 }} />
              <Typography variant="h6" noWrap component="div">
                ImprovHQ
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                bgcolor: 'secondary.main',
              },
            }}>
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                bgcolor: 'secondary.main',
              },
            }}
            open>
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: '64px', md: 0 },
          bgcolor: 'background.default',
        }}>
        {children}
      </Box>
    </Box>
  )
}

export default MainLayout
