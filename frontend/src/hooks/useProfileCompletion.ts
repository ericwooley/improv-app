import { useSelector } from 'react-redux'
import { RootState } from '../store'

export const useIsAuthenticated = () => {
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth)

  // Only check profile status when user data is loaded
  const needsToCompleteProfile =
    !isLoading && isAuthenticated && user && user.firstName == 'anon' && user.lastName == 'ymous'
  return {
    isLoading,
    isAuthenticated,
    user,
    needsToCompleteProfile,
  }
}
