import { Routes, Route } from 'react-router-dom'
import { useGetMeQuery } from './store/api/authApi'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import GamesPage from './pages/GamesPage'
import GroupsPage from './pages/GroupsPage'
import NewGroupPage from './pages/NewGroupPage'
import GroupDetailsPage from './pages/GroupDetailsPage'
import GroupMembersPage from './pages/GroupMembersPage'
import EditGroupPage from './pages/EditGroupPage'
import EventsPage from './pages/EventsPage'
import NewEventPage from './pages/NewEventPage'
import NewGamePage from './pages/NewGamePage'
import GameDetailsPage from './pages/GameDetailsPage'
import EditGamePage from './pages/EditGamePage'
import NotFoundPage from './pages/NotFoundPage'

const AppRoutes = () => {
  const { isLoading } = useGetMeQuery()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <span className="icon is-large">
          <i className="fas fa-spinner fa-pulse fa-3x"></i>
        </span>
      </div>
    )
  }

  return (
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
