import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Base API with shared configuration
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Add auth token if available
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Auth', 'User', 'Groups', 'Events', 'Games', 'Invitations'],
  endpoints: () => ({}),
})
