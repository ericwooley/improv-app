import { Outlet, Link, useLocation } from 'react-router-dom'
import '../index.css'

interface User {
  firstName: string
  lastName: string
}

interface MainLayoutProps {
  user?: User
}

const MainLayout = ({ user }: MainLayoutProps) => {
  const location = useLocation()

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="title is-5 has-text-white">Improv App</h1>
        </div>
        <div className="sidebar-menu">
          {user ? (
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
          {user && (
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
                  onClick={() => {
                    /* Handle logout */
                  }}
                  className="button is-small is-danger is-outlined is-fullwidth mt-2">
                  <span className="icon is-small">
                    <i className="fas fa-sign-out-alt"></i>
                  </span>
                  <span>Logout</span>
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
