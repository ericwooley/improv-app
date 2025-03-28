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
    getEvents: builder.query<Event[], void>({
      query: () => '/events',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Event' as const, id })), { type: 'Event', id: 'LIST' }]
          : [{ type: 'Event', id: 'LIST' }],
    }),

    getEvent: builder.query<Event, string>({
      query: (id) => `/events/${id}`,
      providesTags: (_, __, id) => [{ type: 'Event', id }],
    }),

    getEventsByGroup: builder.query<Event[], string>({
      query: (groupId) => `/groups/${groupId}/events`,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Event' as const, id })), { type: 'Event', id: 'LIST' }]
          : [{ type: 'Event', id: 'LIST' }],
    }),

    createEvent: builder.mutation<Event, CreateEventRequest>({
      query: (eventData) => ({
        url: '/events',
        method: 'POST',
        body: eventData,
      }),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }],
    }),

    updateEvent: builder.mutation<Event, Partial<Event> & { id: string }>({
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

    deleteEvent: builder.mutation<void, string>({
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
