import { apiSlice } from './apiSlice'

// Define invitation interface
export interface Invitation {
  id: string
  groupId: string
  groupName: string
  email: string
  role: string
  status: string
  invitedBy: string
  inviterName: string
  createdAt: string
}

// Define API response interface
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  error?: string
}

// Define acceptance response
export interface AcceptanceResponse {
  groupId: string
  role: string
}

export const invitationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvitations: builder.query<ApiResponse<Invitation[]>, void>({
      query: () => ({
        url: '/groups/invites',
        method: 'GET',
      }),
      providesTags: ['Invitations', 'Groups'],
    }),
    acceptInvitation: builder.mutation<ApiResponse<void>, { token: string }>({
      query: ({ token }) => ({
        url: '/groups/invites/accept',
        method: 'POST',
        body: { token },
      }),
      invalidatesTags: ['Invitations', 'Groups'],
    }),
    rejectInvitation: builder.mutation<ApiResponse<void>, { token: string }>({
      query: ({ token }) => ({
        url: '/groups/invites/reject',
        method: 'POST',
        body: { token },
      }),
      invalidatesTags: ['Invitations'],
    }),
  }),
})

export const { useGetInvitationsQuery, useAcceptInvitationMutation, useRejectInvitationMutation } = invitationsApi
