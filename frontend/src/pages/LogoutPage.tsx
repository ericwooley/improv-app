import { useEffect } from 'react'
import { useLogoutMutation } from '../store/api/authApi'

const LogoutPage = () => {
  const [logout] = useLogoutMutation()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        window.history.replaceState(null, '', '/')
        window.location.reload()
      }
    }

    performLogout()
  }, [logout])

  return (
    <div data-testid="logout-page">
      <div data-testid="logout-loading">Logging out...</div>
    </div>
  )
}

export default LogoutPage
