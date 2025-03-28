import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { RootState } from '../store'

export const useProfileCompletion = () => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth)
  const navigate = useNavigate()
  const location = useLocation()
  const previousUserState = useRef({ firstName: user?.firstName, lastName: user?.lastName })

  // Only check profile status when user data is loaded
  const needsToCompleteProfile = !isLoading && isAuthenticated && user && (!user.firstName || !user.lastName)

  // Parse redirect path from URL if present
  const searchParams = new URLSearchParams(location.search)
  const redirectAfter = searchParams.get('redirect-after-profile-completion')

  const profileCompleted = user?.firstName && user?.lastName && location.pathname === '/profile' && redirectAfter

  useEffect(() => {
    // Only handle navigation when not in loading state
    if (!isLoading) {
      // Navigate to specified path or default to home when profile is newly completed
      if (profileCompleted) {
        navigate(redirectAfter || '/')
      }

      // If profile needs completion and not on profile page, redirect
      if (needsToCompleteProfile && location.pathname !== '/profile') {
        // Store current path as redirect destination
        const currentPath = location.pathname + location.search
        navigate(`/profile?redirect-after-profile-completion=${encodeURIComponent(currentPath || '/')}`)
      }

      // Keep track of previous state for comparison on next render
      if (user) {
        previousUserState.current = { firstName: user.firstName, lastName: user.lastName }
      }
    }
  }, [
    user,
    navigate,
    profileCompleted,
    isLoading,
    needsToCompleteProfile,
    location.pathname,
    location.search,
    redirectAfter,
  ])

  return {
    isLoading,
    isAuthenticated,
    user,
    needsToCompleteProfile,
    profileCompleted,
  }
}
