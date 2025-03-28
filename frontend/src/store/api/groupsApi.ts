import { APIResponse } from '../types'
import { apiSlice } from './apiSlice'

export interface Group {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface CreateGroupRequest {
  name: string
  description: string
}

export const groupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<APIResponse<Group[]>, void>({
      query: () => '/groups',
      providesTags: (result) => {
        return result
          ? [...result.data.map(({ id }) => ({ type: 'Group' as const, id })), { type: 'Group', id: 'LIST' }]
          : [{ type: 'Group', id: 'LIST' }]
      },
    }),

    getGroup: builder.query<Group, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (_, __, id) => [{ type: 'Group', id }],
    }),

    createGroup: builder.mutation<Group, CreateGroupRequest>({
      query: (groupData) => ({
        url: '/groups',
        method: 'POST',
        body: groupData,
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),

    updateGroup: builder.mutation<Group, Partial<Group> & { id: string }>({
      query: ({ id, ...groupData }) => ({
        url: `/groups/${id}`,
        method: 'PUT',
        body: groupData,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Group', id },
        { type: 'Group', id: 'LIST' },
      ],
    }),

    deleteGroup: builder.mutation<void, string>({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} = groupsApi
