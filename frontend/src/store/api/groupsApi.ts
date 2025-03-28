import { APIResponse } from '../types'
import { apiSlice } from './apiSlice'

export interface Group {
  ID: string
  Name: string
  Description: string
  CreatedAt: string
  CreatedBy: string
}

export interface GroupMember {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export interface GroupDetails {
  group: Group
  members: GroupMember[]
  userRole: string
}

export interface GroupGame {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  public: boolean
  createdAt: string
  createdBy: string
  ownedByGroup?: boolean
}

export interface CreateGroupRequest {
  name: string
  description: string
}

export interface AddGameToLibraryRequest {
  gameId: string
  groupId: string
}

export const groupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<APIResponse<Group[]>, void>({
      query: () => '/groups',
      providesTags: (result) => {
        return result
          ? [...result.data.map(({ ID }) => ({ type: 'Group' as const, ID })), { type: 'Group', ID: 'LIST' }]
          : [{ type: 'Group', ID: 'LIST' }]
      },
    }),

    getGroup: builder.query<APIResponse<GroupDetails>, string>({
      query: (id) => `/groups/${id}`,
      providesTags: (_, __, id) => [{ type: 'Group', id }],
    }),

    createGroup: builder.mutation<APIResponse<Group>, CreateGroupRequest>({
      query: (groupData) => ({
        url: '/groups',
        method: 'POST',
        body: groupData,
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),

    updateGroup: builder.mutation<APIResponse<Group>, Partial<Group> & { id: string }>({
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

    deleteGroup: builder.mutation<APIResponse<void>, string>({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),

    getGroupLibraryGames: builder.query<APIResponse<GroupGame[]>, string>({
      query: (id) => `/groups/${id}/games/library`,
      providesTags: (_, __, id) => [{ type: 'Game', id: `${id}-library` }],
    }),

    getGroupOwnedGames: builder.query<APIResponse<GroupGame[]>, string>({
      query: (id) => `/groups/${id}/games/owned`,
      providesTags: (_, __, id) => [{ type: 'Game', id: `${id}-owned` }],
    }),

    addGameToLibrary: builder.mutation<APIResponse<void>, AddGameToLibraryRequest>({
      query: ({ groupId, gameId }) => ({
        url: `/groups/${groupId}/games/library/${gameId}`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, { groupId }) => [{ type: 'Game', id: `${groupId}-library` }],
    }),

    removeGameFromLibrary: builder.mutation<APIResponse<void>, AddGameToLibraryRequest>({
      query: ({ groupId, gameId }) => ({
        url: `/groups/${groupId}/games/library/${gameId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, { groupId }) => [{ type: 'Game', id: `${groupId}-library` }],
    }),
  }),
})

export const {
  useGetGroupsQuery,
  useGetGroupQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupLibraryGamesQuery,
  useGetGroupOwnedGamesQuery,
  useAddGameToLibraryMutation,
  useRemoveGameFromLibraryMutation,
} = groupsApi
