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

export interface AddMemberRequest {
  email: string
  role: string
}

export interface UpdateMemberRoleRequest {
  role: string
}

export interface GroupInviteLink {
  id: string
  groupId: string
  description: string
  code: string
  expiresAt: string
  active: boolean
  createdBy: string
  createdAt: string
}

export interface CreateGroupInviteLinkRequest {
  description: string
  expiresAt: string
}

export interface UpdateInviteLinkStatusRequest {
  active: boolean
}

export const groupsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<APIResponse<Group[]>, void>({
      query: () => '/groups',
      providesTags: (result: APIResponse<Group[]> | undefined) => {
        return result
          ? [...result.data.map(({ ID }: Group) => ({ type: 'Group' as const, ID })), { type: 'Group', id: 'LIST' }]
          : [{ type: 'Group', id: 'LIST' }]
      },
    }),

    getGroup: builder.query<APIResponse<GroupDetails>, string>({
      query: (id: string) => `/groups/${id}`,
      providesTags: (_result: unknown, _error: unknown, id: string) => [{ type: 'Group', id }],
    }),

    createGroup: builder.mutation<APIResponse<Group>, CreateGroupRequest>({
      query: (groupData: CreateGroupRequest) => ({
        url: '/groups',
        method: 'POST',
        body: groupData,
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),

    updateGroup: builder.mutation<APIResponse<Group>, Partial<Group> & { id: string }>({
      query: ({ id, ...groupData }: Partial<Group> & { id: string }) => ({
        url: `/groups/${id}`,
        method: 'PUT',
        body: groupData,
      }),
      invalidatesTags: (_result: unknown, _error: unknown, { id }: { id: string }) => [
        { type: 'Group', id },
        { type: 'Group', id: 'LIST' },
      ],
    }),

    deleteGroup: builder.mutation<APIResponse<void>, string>({
      query: (id: string) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Group', id: 'LIST' }],
    }),

    getGroupLibraryGames: builder.query<APIResponse<GroupGame[]>, string>({
      query: (id: string) => `/groups/${id}/games/library`,
      providesTags: (_result: unknown, _error: unknown, id: string) => [{ type: 'Game', id: `${id}-library` }],
    }),

    getGroupOwnedGames: builder.query<APIResponse<GroupGame[]>, string>({
      query: (id: string) => `/groups/${id}/games/owned`,
      providesTags: (_result: unknown, _error: unknown, id: string) => [{ type: 'Game', id: `${id}-owned` }],
    }),

    addGameToLibrary: builder.mutation<APIResponse<void>, AddGameToLibraryRequest>({
      query: ({ groupId, gameId }: AddGameToLibraryRequest) => ({
        url: `/groups/${groupId}/games/library/${gameId}`,
        method: 'POST',
      }),
      invalidatesTags: (_result: unknown, _error: unknown, { groupId }: AddGameToLibraryRequest) => [
        { type: 'Game', id: `${groupId}-library` },
      ],
    }),

    removeGameFromLibrary: builder.mutation<APIResponse<void>, AddGameToLibraryRequest>({
      query: ({ groupId, gameId }: AddGameToLibraryRequest) => ({
        url: `/groups/${groupId}/games/library/${gameId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result: unknown, _error: unknown, { groupId }: AddGameToLibraryRequest) => [
        { type: 'Game', id: `${groupId}-library` },
      ],
    }),

    getGroupMembers: builder.query<APIResponse<GroupMember[]>, string>({
      query: (id: string) => `/groups/${id}/members`,
      providesTags: (_result: unknown, _error: unknown, id: string) => [{ type: 'Group', id }],
    }),

    addMember: builder.mutation<APIResponse<GroupMember>, { groupId: string; memberData: AddMemberRequest }>({
      query: ({ groupId, memberData }: { groupId: string; memberData: AddMemberRequest }) => ({
        url: `/groups/${groupId}/members`,
        method: 'POST',
        body: memberData,
      }),
      invalidatesTags: (_result: unknown, _error: unknown, { groupId }: { groupId: string }) => [
        { type: 'Group', id: groupId },
      ],
    }),

    updateMemberRole: builder.mutation<
      APIResponse<GroupMember>,
      { groupId: string; userId: string; roleData: UpdateMemberRoleRequest }
    >({
      query: ({
        groupId,
        userId,
        roleData,
      }: {
        groupId: string
        userId: string
        roleData: UpdateMemberRoleRequest
      }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'PUT',
        body: roleData,
      }),
      invalidatesTags: (_result: unknown, _error: unknown, { groupId }: { groupId: string }) => [
        { type: 'Group', id: groupId },
      ],
    }),

    removeMember: builder.mutation<APIResponse<void>, { groupId: string; userId: string }>({
      query: ({ groupId, userId }: { groupId: string; userId: string }) => ({
        url: `/groups/${groupId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result: unknown, _error: unknown, { groupId }: { groupId: string }) => [
        { type: 'Group', id: groupId },
      ],
    }),

    getGroupInviteLinks: builder.query<APIResponse<GroupInviteLink[]>, string>({
      query: (groupId: string) => `/groups/${groupId}/invites`,
      providesTags: (_result: unknown, _error: unknown, groupId: string) => [{ type: 'GroupInvites', id: groupId }],
    }),

    createGroupInviteLink: builder.mutation<
      APIResponse<GroupInviteLink>,
      { groupId: string; data: CreateGroupInviteLinkRequest }
    >({
      query: ({ groupId, data }: { groupId: string; data: CreateGroupInviteLinkRequest }) => {
        return {
          url: `/groups/${groupId}/invites`,
          method: 'POST',
          body: data,
        }
      },
      invalidatesTags: (_result: unknown, _error: unknown, { groupId }: { groupId: string }) => [
        { type: 'GroupInvites', id: groupId },
      ],
    }),

    updateGroupInviteLinkStatus: builder.mutation<
      APIResponse<GroupInviteLink>,
      { groupId: string; linkId: string; data: UpdateInviteLinkStatusRequest }
    >({
      query: ({ groupId, linkId, data }: { groupId: string; linkId: string; data: UpdateInviteLinkStatusRequest }) => ({
        url: `/groups/${groupId}/invites/${linkId}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result: unknown, _error: unknown, { groupId }: { groupId: string }) => [
        { type: 'GroupInvites', id: groupId },
      ],
    }),

    joinGroupViaInvite: builder.mutation<APIResponse<Group>, string>({
      query: (code: string) => ({
        url: `/join/${code}`,
        method: 'POST',
      }),
      invalidatesTags: ['Groups'],
    }),

    verifyInviteLink: builder.query<APIResponse<Group>, string>({
      query: (code: string) => `/join/${code}`,
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
  useGetGroupMembersQuery,
  useAddMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetGroupInviteLinksQuery,
  useCreateGroupInviteLinkMutation,
  useUpdateGroupInviteLinkStatusMutation,
  useJoinGroupViaInviteMutation,
  useVerifyInviteLinkQuery,
} = groupsApi
