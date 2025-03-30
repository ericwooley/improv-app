import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Base API slice that will be extended by other feature-specific APIs
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include', // Include cookies for auth
  }),
  tagTypes: [
    'User',
    'Game',
    'Group',
    'Event',
    'Invitation',
    'Groups',
    'Events',
    'Games',
    'Invitations',
    'GroupInvites',
  ],
  endpoints: () => ({}),
})
