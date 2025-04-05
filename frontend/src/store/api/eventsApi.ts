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
  rsvps: unknown
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

export interface CreateEventRequest {
  title: string
  description: string
  location: string
  startTime: string
  groupId: string
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
} = eventsApi
