import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { User } from '../api/authApi'
import { authApi } from '../api/authApi'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    clearCredentials: (state) => {
      state.user = null
      state.isAuthenticated = false
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addMatcher(authApi.endpoints.login.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(authApi.endpoints.login.matchFulfilled, (state) => {
        state.isLoading = false
        // Don't update user here - we'll wait for verification
      })
      .addMatcher(authApi.endpoints.login.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })

      // Get Current User
      .addMatcher(authApi.endpoints.getMe.matchPending, (state) => {
        state.isLoading = true
      })
      .addMatcher(authApi.endpoints.getMe.matchFulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addMatcher(authApi.endpoints.getMe.matchRejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.isAuthenticated = false
        state.error = action.error.message || 'Authentication failed'
      })

      // Logout
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
      })

      // Update Profile
      .addMatcher(authApi.endpoints.updateProfile.matchPending, (state) => {
        state.isLoading = true
      })
      .addMatcher(authApi.endpoints.updateProfile.matchFulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
      })
      .addMatcher(authApi.endpoints.updateProfile.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Profile update failed'
      })
  },
})

export const { setCredentials, clearCredentials, setLoading, setError } = authSlice.actions

export default authSlice.reducer
