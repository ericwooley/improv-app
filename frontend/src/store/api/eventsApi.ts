import { APIResponse } from '../types'
import { apiSlice } from './apiSlice'

export interface Event {
  id: string
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  groupId: string
  groupName?: string
}


export interface EventDetailsResponse {
  event: {
    ID: string
    GroupID: string
    Title: string
    Description: string
    Location: string
    StartTime: string
    EndTime: string
    CreatedAt: string
    CreatedBy: string
  }
  groupName: string
  rsvps: unknown
  games: unknown
}

export interface CreateEventRequest {
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
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

    getEventsByGroup: builder.query<APIResponse<Event[]>, string>({
      query: (groupId) => `/groups/${groupId}/events`,
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: 'Event' as const, id })), { type: 'Event', id: 'LIST' }]
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
  }),
})

export const {
  useGetEventsQuery,
  useGetEventQuery,
  useGetEventsByGroupQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} = eventsApi
