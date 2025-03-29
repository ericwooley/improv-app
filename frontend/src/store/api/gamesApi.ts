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

export interface UpcomingEvent {
  id: string
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  groupId: string
  groupName: string
}

export interface GameDetailsResponse {
  game: Game
  rating: number
  upcomingEvents: UpcomingEvent[]
}

export interface GroupWithRole {
  id: string
  name: string
  description: string
  createdAt: string
  createdBy: string
  userRole: string
}

export interface CreateGameRequest {
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  groupId: string
  tags: string
  public: boolean
}

export interface RateGameRequest {
  rating: number
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

    fetchAllowedTags: builder.query<APIResponse<string[]>, void>({
      query: () => '/games/tags',
      transformResponse: (response: APIResponse<string[]>) => response,
    }),

    getGame: builder.query<APIResponse<GameDetailsResponse>, string>({
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

    rateGame: builder.mutation<APIResponse<{ gameId: string; rating: number }>, { gameId: string; rating: number }>({
      query: ({ gameId, rating }) => ({
        url: `/games/${gameId}/rate`,
        method: 'POST',
        body: { rating },
      }),
      invalidatesTags: (_, __, { gameId }) => [{ type: 'Game', id: gameId }],
    }),

    getGameGroupLibraries: builder.query<APIResponse<GroupWithRole[]>, string>({
      query: (gameId) => `/games/${gameId}/libraries`,
      providesTags: (_, __, gameId) => [{ type: 'Game' as const, id: `library-${gameId}` }],
    }),
  }),
})

export const {
  useGetGamesQuery,
  useGetGameQuery,
  useCreateGameMutation,
  useUpdateGameMutation,
  useDeleteGameMutation,
  useRateGameMutation,
  useGetGameGroupLibrariesQuery,
  useFetchAllowedTagsQuery,
} = gamesApi
