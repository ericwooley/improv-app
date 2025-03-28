import { createBrowserRouter, RouterProvider } from 'react-router-dom'

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

// Mock data (until backend integration)
const mockUser = {
  firstName: 'John',
  lastName: 'Doe',
}

const mockGroups = [
  {
    id: '1',
    name: 'Downtown Improvisers',
    description: 'A fun group of improvisers meeting in downtown area',
    createdAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    name: 'Comedy Workshop',
    description: 'Focused on short-form improv games and techniques',
    createdAt: new Date('2023-03-22'),
  },
]

const mockGames = [
  {
    id: '1',
    name: 'Freeze Tag',
    description:
      'Two players start a scene. At any point, another player can call "freeze", replace one of the players, and start a new scene.',
    minPlayers: 3,
    maxPlayers: 12,
    tags: ['warm-up', 'physical', 'quick'],
  },
  {
    id: '2',
    name: 'Word at a Time Story',
    description: 'Players tell a story one word at a time, going around in a circle.',
    minPlayers: 4,
    maxPlayers: 10,
    tags: ['warm-up', 'verbal', 'focus'],
  },
]

const mockEvents = [
  {
    id: '1',
    title: 'Weekly Practice',
    description: 'Our regular weekly practice session',
    location: '123 Improv St, Suite 101',
    startTime: new Date('2023-06-15T18:30:00'),
    endTime: new Date('2023-06-15T20:30:00'),
    groupId: '1',
    groupName: 'Downtown Improvisers',
  },
  {
    id: '2',
    title: 'Workshop: Character Development',
    description: 'Special workshop focused on character creation techniques',
    location: 'City Arts Center',
    startTime: new Date('2023-06-22T19:00:00'),
    endTime: new Date('2023-06-22T21:30:00'),
    groupId: '2',
    groupName: 'Comedy Workshop',
  },
]

// Create routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout user={mockUser} />,
    children: [
      {
        index: true,
        element: <HomePage user={mockUser} groups={mockGroups} events={mockEvents} />,
      },
      {
        path: 'profile',
        element: <ProfilePage user={mockUser} />,
      },
      {
        path: 'games',
        element: <GamesPage initialGames={mockGames} />,
      },
      {
        path: 'groups',
        element: <GroupsPage initialGroups={mockGroups} />,
      },
      {
        path: 'events',
        element: <EventsPage initialEvents={mockEvents} groups={mockGroups} />,
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
  return <RouterProvider router={router} />
}

export default App
