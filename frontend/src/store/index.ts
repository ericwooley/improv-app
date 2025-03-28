import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { apiSlice } from './api/apiSlice'
import authReducer from './slices/authSlice'
import groupsReducer from './slices/groupsSlice'
import eventsReducer from './slices/eventsSlice'
import gamesReducer from './slices/gamesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groups: groupsReducer,
    events: eventsReducer,
    games: gamesReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
})

// Enable refetchOnFocus/refetchOnReconnect for RTK Query
setupListeners(store.dispatch)

// Export types for RootState and AppDispatch
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
