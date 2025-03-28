import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Group } from '../api/groupsApi'
import { groupsApi } from '../api/groupsApi'

interface GroupsState {
  groups: Group[]
  selectedGroup: Group | null
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

const initialState: GroupsState = {
  groups: [],
  selectedGroup: null,
  isLoading: false,
  error: null,
}

export const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroups: (state, action: PayloadAction<Group[]>) => {
      state.groups = action.payload
      state.error = null
    },
    setSelectedGroup: (state, action: PayloadAction<Group | null>) => {
      state.selectedGroup = action.payload
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
      // Get Groups
      .addMatcher(groupsApi.endpoints.getGroups.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(groupsApi.endpoints.getGroups.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<Group[]>
        state.groups = response.data || []
      })
      .addMatcher(groupsApi.endpoints.getGroups.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch groups'
      })

      // Get Group by ID
      .addMatcher(groupsApi.endpoints.getGroup.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(groupsApi.endpoints.getGroup.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<{ group: Group }>
        state.selectedGroup = response.data?.group || null
      })
      .addMatcher(groupsApi.endpoints.getGroup.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch group'
      })

      // Create Group
      .addMatcher(groupsApi.endpoints.createGroup.matchPending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addMatcher(groupsApi.endpoints.createGroup.matchFulfilled, (state, action) => {
        state.isLoading = false
        // The API returns data inside a success wrapper
        const response = action.payload as unknown as ApiResponse<Group>
        if (response.data) {
          state.groups = [...state.groups, response.data]
        }
      })
      .addMatcher(groupsApi.endpoints.createGroup.matchRejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to create group'
      })
  },
})

export const { setGroups, setSelectedGroup, setLoading, setError } = groupsSlice.actions

export default groupsSlice.reducer
