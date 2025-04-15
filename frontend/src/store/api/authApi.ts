import { APIResponse } from '../types'
import { apiSlice } from './apiSlice'

export interface LoginRequest {
  email: string
  password?: string
  method?: 'password' | 'magic-link'
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  user: User
  message: string
}

export interface ProfileUpdateRequest {
  firstName: string
  lastName: string
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    getMe: builder.query<APIResponse<User>, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation<APIResponse<User>, ProfileUpdateRequest>({
      query: (profileData) => ({
        url: '/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
})

export const { useLoginMutation, useRegisterMutation, useLogoutMutation, useGetMeQuery, useUpdateProfileMutation } =
  authApi
