import { APIResponse } from '../types'
import { apiSlice } from './apiSlice'

export interface Event {
  id: string
  title: string
  description: string
  location: string
  startTime: string
  groupId: string
  groupName?: string
  mcId?: string | null
}

export interface GroupEvent {
  ID: string
  GroupID: string
  Title: string
  Description: string
  Location: string
  StartTime: string
  EndTime: string
  CreatedAt: string
  CreatedBy: string
  MCID: string
}

export interface EventDetailsResponse {
  event: {
    ID: string
    GroupID: string
    Title: string
    Description: string
    Location: string
    StartTime: string
    CreatedAt: string
    CreatedBy: string
  }
  groupName: string
  rsvps: RSVP[]
  games: Array<{
    id: string
    name: string
    description: string
    minPlayers: number
    maxPlayers: number
    orderIndex: number
    tags: string[]
  }>
  mc?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface RSVP {
  userId: string
  firstName: string
  lastName: string
  status: 'attending' | 'maybe' | 'declined' | 'awaiting-response'
}

export interface CreateEventRequest {
  title: string
  description: string
  location: string
  startTime: string
  groupId: string
}

// Game preferences and player assignments
export interface GamePreference {
  userId: string
  gameId: string
  status?: string
}

export interface PlayerAssignment {
  userId: string
  gameId: string
  eventId: string
  name: string
}

export const eventsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<APIResponse<Event[]>, void>({
      query: () => '/events',
      providesTags: (result) => {
        const r = result?.data
          ? [...result.data.map(({ id }) => ({ type: 'Event' as const, id })), { type: 'Event' as const, id: 'LIST' }]
          : [{ type: 'Event' as const, id: 'LIST' }]
        return r
      },
    }),

    getEvent: builder.query<APIResponse<EventDetailsResponse>, string>({
      query: (id) => `/events/${id}`,
      providesTags: (_, __, id) => [{ type: 'Event', id }],
    }),

    getEventsByGroup: builder.query<APIResponse<GroupEvent[]>, string>({
      query: (groupId) => `/groups/${groupId}/events`,
      providesTags: (result) =>
        result
          ? [...result.data.map(({ ID: id }) => ({ type: 'Event' as const, id })), { type: 'Event', id: 'LIST' }]
          : [{ type: 'Event', id: 'LIST' }],
    }),

    createEvent: builder.mutation<APIResponse<Event>, CreateEventRequest>({
      query: (eventData) => ({
        url: '/events',
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),

    updateEvent: builder.mutation<APIResponse<Event>, Partial<Event> & { id: string }>({
      query: ({ id, ...eventData }) => ({
        url: `/events/${id}`,
        method: 'PUT',
        body: eventData,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Event', id },
        { type: 'Event', id: 'LIST' },
      ],
    }),

    deleteEvent: builder.mutation<APIResponse<void>, string>({
      query: (id) => ({
        url: `/events/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),

    // Event games endpoints
    getEventGames: builder.query<
      {
        success: boolean
        data: {
          games: Array<{
            id: string
            name: string
            description: string
            minPlayers: number
            maxPlayers: number
            orderIndex: number
            tags: string[]
          }>
        }
      },
      string
    >({
      query: (eventId) => `/events/${eventId}/games`,
    }),

    addEventGame: builder.mutation<APIResponse<void>, { eventId: string; gameId: string }>({
      query: ({ eventId, gameId }) => ({
        url: `/events/${eventId}/games`,
        method: 'POST',
        body: { gameId },
      }),
    }),

    removeEventGame: builder.mutation<APIResponse<void>, { eventId: string; gameId: string }>({
      query: ({ eventId, gameId }) => ({
        url: `/events/${eventId}/games/${gameId}`,
        method: 'DELETE',
      }),
    }),

    updateEventGameOrder: builder.mutation<APIResponse<void>, { eventId: string; gameId: string; newIndex: number }>({
      query: ({ eventId, gameId, newIndex }) => ({
        url: `/events/${eventId}/games/${gameId}/order`,
        method: 'PUT',
        body: { orderIndex: newIndex },
      }),
    }),

    // RSVP endpoints
    submitRSVP: builder.mutation<APIResponse<void>, { eventId: string; status: 'attending' | 'maybe' | 'declined' }>({
      query: ({ eventId, status }) => ({
        url: `/events/${eventId}/rsvp`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: (_, __, { eventId }) => [{ type: 'Event', id: eventId }],
    }),

    getCurrentUserRSVP: builder.query<APIResponse<RSVP | null>, string>({
      query: (eventId) => `/events/${eventId}/rsvp/me`,
      providesTags: (_, __, eventId) => [{ type: 'Event', id: `${eventId}-rsvp` }],
    }),

    // Admin/organizer endpoint to update another user's RSVP
    updateUserRSVP: builder.mutation<
      APIResponse<void>,
      { eventId: string; userId: string; status: 'attending' | 'maybe' | 'declined' | 'awaiting-response' }
    >({
      query: ({ eventId, userId, status }) => ({
        url: `/events/${eventId}/rsvp/${userId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (_, __, { eventId }) => [{ type: 'Event', id: eventId }],
    }),

    // Game preference and player assignment endpoints
    getUserGamePreferences: builder.query<APIResponse<GamePreference[]>, { eventId: string; gameIds?: string[] }>({
      query: ({ eventId, gameIds }) => {
        let url = `/events/${eventId}/preferences`
        if (gameIds && gameIds.length > 0) {
          url += `?games=${gameIds.join(',')}`
        }
        return url
      },
      providesTags: (result, error, { eventId }) =>
        result
          ? [
              ...result.data.map(({ gameId, userId }) => ({
                type: 'GamePreferences' as const,
                id: `${eventId}-${gameId}-${userId}`,
              })),
              { type: 'GamePreferences', id: eventId },
            ]
          : [{ type: 'GamePreferences', id: eventId }],
    }),

    getEventPlayerAssignments: builder.query<
      APIResponse<PlayerAssignment[]>,
      string // eventId
    >({
      query: (eventId) => `/events/${eventId}/players`,
      providesTags: (_, __, eventId) => [{ type: 'PlayerAssignments', id: eventId }],
    }),

    assignPlayerToGame: builder.mutation<APIResponse<void>, { eventId: string; gameId: string; userId: string }>({
      query: ({ eventId, gameId, userId }) => ({
        url: `/events/${eventId}/games/${gameId}/players`,
        method: 'POST',
        body: { userId },
      }),
      invalidatesTags: (result, error, { eventId }) => [{ type: 'PlayerAssignments', id: eventId }],
    }),

    removePlayerFromGame: builder.mutation<APIResponse<void>, { eventId: string; gameId: string; userId: string }>({
      query: ({ eventId, gameId, userId }) => ({
        url: `/events/${eventId}/games/${gameId}/players/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { eventId }) => [{ type: 'PlayerAssignments', id: eventId }],
    }),

    // Player assignments endpoints
    getEventPlayers: builder.query<APIResponse<PlayerAssignment[]>, string>({
      query: (eventId) => `/events/${eventId}/players`,
      providesTags: (result, error, eventId) =>
        result
          ? [
              ...result.data.map(({ gameId, userId }) => ({
                type: 'PlayerAssignments' as const,
                id: `${eventId}-${gameId}-${userId}`,
              })),
              { type: 'PlayerAssignments', id: eventId },
            ]
          : [{ type: 'PlayerAssignments', id: eventId }],
    }),
  }),
})

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useGetEventsByGroupQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useGetEventGamesQuery,
  useAddEventGameMutation,
  useRemoveEventGameMutation,
  useUpdateEventGameOrderMutation,
  useSubmitRSVPMutation,
  useGetCurrentUserRSVPQuery,
  useUpdateUserRSVPMutation,
  useGetUserGamePreferencesQuery,
  useGetEventPlayerAssignmentsQuery,
  useAssignPlayerToGameMutation,
  useRemovePlayerFromGameMutation,
  useGetEventPlayersQuery,
} = eventsApi
