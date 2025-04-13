import { Routes, Route, Navigate } from 'react-router-dom'
import { useGetMeQuery } from './store/api/authApi'
import { useSelector } from 'react-redux'
import { RootState } from './store'
import MainLayout from './layout/MainLayout'
import PublicLayout from './layout/PublicLayout'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import GamesPage from './pages/GamesPage'
import PublicGamesPage from './pages/PublicGamesPage'
import GroupsPage from './pages/GroupsPage'
import NewGroupPage from './pages/NewGroupPage'
import GroupDetailsPage from './pages/GroupDetailsPage'
import GroupMembersPage from './pages/GroupMembersPage'
import EditGroupPage from './pages/EditGroupPage'
import EventsPage from './pages/EventsPage'
import NewEventPage from './pages/NewEventPage'
import EventDetailsPage from './pages/EventDetailsPage'
import EditEventPage from './pages/EditEventPage'
import NewGamePage from './pages/NewGamePage'
import GameDetailsPage from './pages/GameDetailsPage'
import EditGamePage from './pages/EditGamePage'
import JoinGroupPage from './pages/JoinGroupPage'
import NotFoundPage from './pages/NotFoundPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import LogoutPage from './pages/LogoutPage'

// Public routes that don't require authentication
const PublicRoutes = () => {
  return (
    <PublicLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/games" element={<PublicGamesPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </PublicLayout>
  )
}

// Private routes that require authentication
const PrivateRoutes = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/new" element={<NewGamePage />} />
        <Route path="/games/:gameId" element={<GameDetailsPage />} />
        <Route path="/games/:gameId/edit" element={<EditGamePage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/new" element={<NewGroupPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailsPage />} />
        <Route path="/groups/:groupId/edit" element={<EditGroupPage />} />
        <Route path="/groups/:groupId/members" element={<GroupMembersPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/events/:eventId/edit" element={<EditEventPage />} />
        <Route path="/join/:code" element={<JoinGroupPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  )
}

const AppRoutes = () => {
  const { isLoading } = useGetMeQuery()
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span className="icon is-large">
          <i className="fas fa-spinner fa-pulse fa-3x"></i>
        </span>
      </div>
    )
  }

  return isAuthenticated ? <PrivateRoutes /> : <PublicRoutes />
}

export default AppRoutes
