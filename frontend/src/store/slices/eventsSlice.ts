import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Event } from '../api/eventsApi'
import { eventsApi } from '../api/eventsApi'

interface EventsState {
  events: Event[]
  selectedEvent: Event | null
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

const initialState: EventsState = {
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,
}

export const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<Event[]>) => {
      state.events = action.payload
      state.error = null
    },
    setSelectedEvent: (state, action: PayloadAction<Event | null>) => {
      state.selectedEvent = action.payload
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
      // Get Events
      .addMatcher(eventsApi.endpoints.getEvents.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(eventsApi.endpoints.getEvents.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<Event[]>
        state.events = response.data || []
      })
      .addMatcher(eventsApi.endpoints.getEvents.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch events'
      })

      // Get Event by ID
      .addMatcher(eventsApi.endpoints.getEvent.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(eventsApi.endpoints.getEvent.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<{ event: Event }>
        state.selectedEvent = response.data?.event || null
      })
      .addMatcher(eventsApi.endpoints.getEvent.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch event'
      })

      // Get Events by Group
      .addMatcher(eventsApi.endpoints.getEventsByGroup.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(eventsApi.endpoints.getEventsByGroup.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<Event[]>
        state.events = response.data || []
      })
      .addMatcher(eventsApi.endpoints.getEventsByGroup.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch events for group'
      })

      // Create Event
      .addMatcher(eventsApi.endpoints.createEvent.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(eventsApi.endpoints.createEvent.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<Event>
        if (response.data) {
          state.events = [...state.events, response.data]
        }
      })
      .addMatcher(eventsApi.endpoints.createEvent.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to create event'
      })
  },
})

export const { setEvents, setSelectedEvent, setLoading, setError } = eventsSlice.actions

export default eventsSlice.reducer
