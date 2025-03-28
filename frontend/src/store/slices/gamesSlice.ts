import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Game } from '../api/gamesApi'
import { gamesApi } from '../api/gamesApi'

interface GamesState {
  games: Game[]
  selectedGame: Game | null
  isLoading: boolean
  error: string | null
}

// Define API response structure
interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
}

const initialState: GamesState = {
  games: [],
  selectedGame: null,
  isLoading: false,
  error: null,
}

export const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    setGames: (state, action: PayloadAction<Game[]>) => {
      state.games = action.payload
      state.error = null
    },
    setSelectedGame: (state, action: PayloadAction<Game | null>) => {
      state.selectedGame = action.payload
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
      // Get Games
      .addMatcher(gamesApi.endpoints.getGames.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(gamesApi.endpoints.getGames.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<Game[]>
        state.games = response.data || []
      })
      .addMatcher(gamesApi.endpoints.getGames.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch games'
      })

      // Get Game by ID
      .addMatcher(gamesApi.endpoints.getGame.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(gamesApi.endpoints.getGame.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns game inside a data object with extra fields
        const response = action.payload as unknown as ApiResponse<{ game: Game }>
        state.selectedGame = response.data?.game || null
      })
      .addMatcher(gamesApi.endpoints.getGame.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch game'
      })

      // Create Game
      .addMatcher(gamesApi.endpoints.createGame.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(gamesApi.endpoints.createGame.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<Game>
        if (response.data) {
          state.games = [...state.games, response.data]
        }
      })
      .addMatcher(gamesApi.endpoints.createGame.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to create game'
      })
  },
})

export const { setGames, setSelectedGame, setLoading, setError } = gamesSlice.actions

export default gamesSlice.reducer
