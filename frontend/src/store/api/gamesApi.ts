import { apiSlice } from './apiSlice'
import { APIResponse } from '../types'

export interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  createdBy: string
  groupId: string
  public: boolean
  createdAt: string
  tags: string[]
}

export interface CreateGameRequest {
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  groupId: string
  tags: string
}

export const gamesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query<APIResponse<Game[]>, void>({
      query: () => '/games',
      providesTags: (result) =>
        result
          ? [...result.data.map(({ id }) => ({ type: 'Game' as const, id })), { type: 'Game', id: 'LIST' }]
          : [{ type: 'Game', id: 'LIST' }],
    }),

    getGame: builder.query<APIResponse<Game>, string>({
      query: (id) => `/games/${id}`,
      providesTags: (_, __, id) => [{ type: 'Game', id }],
    }),

    createGame: builder.mutation<APIResponse<Game>, CreateGameRequest>({
      query: (gameData) => ({
        url: '/games',
        method: 'POST',
        body: {
          ...gameData,
          tags: gameData.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        },
      }),
      invalidatesTags: [{ type: 'Game', id: 'LIST' }],
    }),

    updateGame: builder.mutation<APIResponse<Game>, Partial<Game> & { id: string }>({
      query: ({ id, ...gameData }) => ({
        url: `/games/${id}`,
        method: 'PUT',
        body: gameData,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Game', id },
        { type: 'Game', id: 'LIST' },
      ],
    }),

    deleteGame: builder.mutation<APIResponse<void>, string>({
      query: (id) => ({
        url: `/games/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Game', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetGamesQuery,
  useGetGameQuery,
  useCreateGameMutation,
  useUpdateGameMutation,
  useDeleteGameMutation,
} = gamesApi
