import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useGetMeQuery } from './store/api/authApi'

// Layout
import MainLayout from './layout/MainLayout'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import GamesPage from './pages/GamesPage'
import GroupsPage from './pages/GroupsPage'
import EventsPage from './pages/EventsPage'
import NotFoundPage from './pages/NotFoundPage'

// Create routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'games',
        element: <GamesPage />,
      },
      {
        path: 'groups',
        element: <GroupsPage />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
])

function App() {
  // Fetch the current user when the app loads
  const { isLoading } = useGetMeQuery()

  // We don't need to manually update the store with the user data
  // because the authSlice extraReducers will handle that automatically

  if (isLoading) {
    return (
      <div className="is-flex is-justify-content-center is-align-items-center" style={{ height: '100vh' }}>
        <span className="icon is-large">
          <i className="fas fa-spinner fa-pulse fa-3x"></i>
        </span>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
