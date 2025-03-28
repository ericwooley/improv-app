import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store'
import { useLogoutMutation } from '../store/api/authApi'
import { clearCredentials } from '../store/slices/authSlice'
import '../index.css'

const MainLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Get auth state from Redux
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth)

  // Get logout mutation
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout().unwrap()
      dispatch(clearCredentials())
      navigate('/login')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="title is-5 has-text-white">Improv App</h1>
        </div>
        <div className="sidebar-menu">
          {isAuthenticated ? (
            <>
              <Link to="/" className={location.pathname === '/' ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-home"></i> Dashboard
              </Link>
              <Link to="/groups" className={location.pathname.startsWith('/groups') ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-users"></i> Groups
              </Link>
              <Link to="/games" className={location.pathname.startsWith('/games') ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-dice"></i> Games
              </Link>
              <Link to="/events" className={location.pathname.startsWith('/events') ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-calendar-alt"></i> Events
              </Link>
              <Link to="/profile" className={location.pathname === '/profile' ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-user-circle"></i> Profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={location.pathname === '/' ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-home"></i> Home
              </Link>
              <Link to="/login" className={location.pathname === '/login' ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-sign-in-alt"></i> Login
              </Link>
              <Link to="/register" className={location.pathname === '/register' ? 'active-link mb-2' : 'mb-2'}>
                <i className="fas fa-user-plus"></i> Register
              </Link>
            </>
          )}
        </div>
        <div className="sidebar-user">
          {isAuthenticated && user && (
            <div className="is-flex is-align-items-center">
              <div className="is-flex-shrink-0 mr-3">
                <span className="icon is-medium has-text-light">
                  <i className="fas fa-user-circle fa-2x"></i>
                </span>
              </div>
              <div>
                <p className="has-text-weight-medium">
                  {user.firstName} {user.lastName}
                </p>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="button is-small is-danger is-outlined is-fullwidth mt-2">
                  <span className="icon is-small">
                    <i className="fas fa-sign-out-alt"></i>
                  </span>
                  <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Main Content */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout
