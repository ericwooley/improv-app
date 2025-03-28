import { apiSlice } from './apiSlice'

export interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  tags: string[]
}

export interface CreateGameRequest {
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  tags: string
}

export const gamesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGames: builder.query<Game[], void>({
      query: () => '/games',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Game' as const, id })), { type: 'Game', id: 'LIST' }]
          : [{ type: 'Game', id: 'LIST' }],
    }),

    getGame: builder.query<Game, string>({
      query: (id) => `/games/${id}`,
      providesTags: (_, __, id) => [{ type: 'Game', id }],
    }),

    createGame: builder.mutation<Game, CreateGameRequest>({
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

    updateGame: builder.mutation<Game, Partial<Game> & { id: string }>({
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

    deleteGame: builder.mutation<void, string>({
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
