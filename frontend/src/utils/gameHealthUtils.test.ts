import { describe, it, expect } from 'vitest'
import {
  analyzeGameHealth,
  calculateOverallHealthScore,
  getImprovedAssignmentSuggestions,
  GameData,
} from './gameHealthUtils'

// Sample test data
const mockGameData: GameData = {
  games: [
    {
      id: '1',
      name: 'Game 1',
      description: 'Description 1',
      minPlayers: 2,
      maxPlayers: 4,
      orderIndex: 0,
      tags: ['tag1'],
    },
    {
      id: '2',
      name: 'Game 2',
      description: 'Description 2',
      minPlayers: 3,
      maxPlayers: 6,
      orderIndex: 1,
      tags: ['tag2'],
    },
    {
      id: '3',
      name: 'Game 3',
      description: 'Description 3',
      minPlayers: 2,
      maxPlayers: 5,
      orderIndex: 2,
      tags: [],
    },
  ],
  players: [
    {
      userId: 'user1',
      firstName: 'John',
      lastName: 'Doe',
      status: 'attending',
    },
    {
      userId: 'user2',
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'attending',
    },
    {
      userId: 'user3',
      firstName: 'Bob',
      lastName: 'Johnson',
      status: 'attending',
    },
  ],
  assignments: [
    {
      userId: 'user1',
      gameId: '1',
      eventId: 'event1',
      name: 'John Doe',
    },
    {
      userId: 'user1',
      gameId: '2',
      eventId: 'event1',
      name: 'John Doe',
    },
    {
      userId: 'user2',
      gameId: '2',
      eventId: 'event1',
      name: 'Jane Smith',
    },
    {
      userId: 'user3',
      gameId: '3',
      eventId: 'event1',
      name: 'Bob Johnson',
    },
  ],
  preferences: [
    {
      userId: 'user1',
      gameId: '1',
      status: 'I Love playing this',
    },
    {
      userId: 'user1',
      gameId: '3',
      status: 'I Love playing this',
    },
    {
      userId: 'user2',
      gameId: '2',
      status: 'I Need to practice this',
    },
    {
      userId: 'user2',
      gameId: '3',
      status: 'I dont like this game',
    },
    {
      userId: 'user3',
      gameId: '1',
      status: 'I Love playing this',
    },
  ],
}

describe('gameHealthUtils', () => {
  describe('analyzeGameHealth', () => {
    it('should identify players with too few games', () => {
      // Create data with user3 having fewer games than average
      const dataWithUnbalancedGames = {
        ...mockGameData,
        assignments: [
          {
            userId: 'user1',
            gameId: '1',
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user1',
            gameId: '2',
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user1',
            gameId: '3',
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user2',
            gameId: '2',
            eventId: 'event1',
            name: 'Jane Smith',
          },
          {
            userId: 'user2',
            gameId: '1',
            eventId: 'event1',
            name: 'Jane Smith',
          },
          // User3 has only one game
          {
            userId: 'user3',
            gameId: '3',
            eventId: 'event1',
            name: 'Bob Johnson',
          },
        ],
      }

      const results = analyzeGameHealth(dataWithUnbalancedGames)

      // Find user3 who has only 1 game vs average of 2
      const user3Results = results.find((p) => p.userId === 'user3')
      expect(user3Results).toBeDefined()
      expect(user3Results?.problems.some((p) => p.type === 'too-few-games')).toBe(true)
    })

    it('should identify players with too many games', () => {
      // Create data with user1 having more games than average
      const dataWithUnbalancedGames = {
        ...mockGameData,
        assignments: [
          // User1 has three games
          {
            userId: 'user1',
            gameId: '1',
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user1',
            gameId: '2',
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user1',
            gameId: '3',
            eventId: 'event1',
            name: 'John Doe',
          },
          // User2 has one game
          {
            userId: 'user2',
            gameId: '2',
            eventId: 'event1',
            name: 'Jane Smith',
          },
          // User3 has one game
          {
            userId: 'user3',
            gameId: '3',
            eventId: 'event1',
            name: 'Bob Johnson',
          },
        ],
      }

      const results = analyzeGameHealth(dataWithUnbalancedGames)

      // Find user1 who has 3 games (above average)
      const user1Results = results.find((p) => p.userId === 'user1')
      expect(user1Results).toBeDefined()
      expect(user1Results?.problems.some((p) => p.type === 'too-many-games')).toBe(true)
    })

    it('should identify players assigned to games they dislike', () => {
      const results = analyzeGameHealth(mockGameData)

      // User2 dislikes game3 but isn't assigned to it - should have no disliked-game problems
      const user2Results = results.find((p) => p.userId === 'user2')
      expect(user2Results).toBeDefined()
      expect(user2Results?.problems.some((p) => p.type === 'disliked-game')).toBe(false)

      // Let's modify the data to have user2 assigned to a disliked game
      const modifiedData = {
        ...mockGameData,
        assignments: [
          ...mockGameData.assignments,
          {
            userId: 'user2',
            gameId: '3', // User2 dislikes game3
            eventId: 'event1',
            name: 'Jane Smith',
          },
        ],
      }

      const modifiedResults = analyzeGameHealth(modifiedData)
      const modifiedUser2Results = modifiedResults.find((p) => p.userId === 'user2')
      expect(modifiedUser2Results).toBeDefined()
      expect(modifiedUser2Results?.problems.some((p) => p.type === 'disliked-game')).toBe(true)
    })

    it('should identify players missing games they love', () => {
      const results = analyzeGameHealth(mockGameData)

      // User1 loves game3 but isn't assigned to it
      const user1Results = results.find((p) => p.userId === 'user1')
      expect(user1Results).toBeDefined()
      expect(user1Results?.problems.some((p) => p.type === 'unbalanced-assignments')).toBe(true)

      // User3 loves game1 but isn't assigned to it
      const user3Results = results.find((p) => p.userId === 'user3')
      expect(user3Results).toBeDefined()
      expect(user3Results?.problems.some((p) => p.type === 'unbalanced-assignments')).toBe(true)
    })

    it('should calculate happiness scores correctly', () => {
      const results = analyzeGameHealth(mockGameData)

      // User1: Loves game1 (+2), assigned to game2 (no preference, +0) = +2
      const user1Results = results.find((p) => p.userId === 'user1')
      expect(user1Results?.happinessScore).toBe(2)

      // User2: Needs to practice game2 (+1) = +1
      const user2Results = results.find((p) => p.userId === 'user2')
      expect(user2Results?.happinessScore).toBe(1)

      // User3: No preferences for assigned games = +0
      const user3Results = results.find((p) => p.userId === 'user3')
      expect(user3Results?.happinessScore).toBe(0)
    })
  })

  describe('calculateOverallHealthScore', () => {
    it('should return 100 for an empty array', () => {
      const score = calculateOverallHealthScore([])
      expect(score).toBe(100)
    })

    it('should calculate a lower score when there are problems', () => {
      const results = analyzeGameHealth(mockGameData)
      const score = calculateOverallHealthScore(results)

      // Score should be less than 100 because we have problems
      expect(score).toBeLessThan(100)
    })

    it('should calculate a higher score for better assignments', () => {
      // Create data with optimal assignments
      const optimalData = {
        ...mockGameData,
        assignments: [
          {
            userId: 'user1',
            gameId: '1', // User1 loves game1
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user1',
            gameId: '3', // User1 loves game3
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user2',
            gameId: '2', // User2 needs to practice game2
            eventId: 'event1',
            name: 'Jane Smith',
          },
          {
            userId: 'user3',
            gameId: '1', // User3 loves game1
            eventId: 'event1',
            name: 'Bob Johnson',
          },
        ],
      }

      const optimalResults = analyzeGameHealth(optimalData)
      const optimalScore = calculateOverallHealthScore(optimalResults)

      // Original score with problems
      const originalResults = analyzeGameHealth(mockGameData)
      const originalScore = calculateOverallHealthScore(originalResults)

      // Optimal score should be higher
      expect(optimalScore).toBeGreaterThan(originalScore)
    })
  })

  describe('getImprovedAssignmentSuggestions', () => {
    it('should suggest adding players to more games when they have too few', () => {
      // Create data with user3 having fewer games than others
      const unbalancedData = {
        ...mockGameData,
        assignments: [
          {
            userId: 'user1',
            gameId: '1',
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user1',
            gameId: '2',
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user2',
            gameId: '1',
            eventId: 'event1',
            name: 'Jane Smith',
          },
          {
            userId: 'user2',
            gameId: '2',
            eventId: 'event1',
            name: 'Jane Smith',
          },
          // User3 has only one game
          {
            userId: 'user3',
            gameId: '3',
            eventId: 'event1',
            name: 'Bob Johnson',
          },
        ],
      }

      const results = analyzeGameHealth(unbalancedData)
      const suggestions = getImprovedAssignmentSuggestions(unbalancedData, results)

      // Should suggest adding user3 to more games
      expect(suggestions.some((s) => s.includes('Bob Johnson') && s.includes('more games'))).toBe(true)
    })

    it('should suggest removing players from disliked games', () => {
      // Create data with user assigned to disliked game
      const dataWithDislikedAssignment = {
        ...mockGameData,
        assignments: [
          ...mockGameData.assignments,
          {
            userId: 'user2',
            gameId: '3', // User2 dislikes game3
            eventId: 'event1',
            name: 'Jane Smith',
          },
        ],
      }

      const results = analyzeGameHealth(dataWithDislikedAssignment)
      const suggestions = getImprovedAssignmentSuggestions(dataWithDislikedAssignment, results)

      // Should suggest removing user2 from game3
      expect(suggestions.some((s) => s.includes('Jane Smith') && s.includes('removing') && s.includes('Game 3'))).toBe(
        true
      )
    })

    it('should suggest adding players to games they love', () => {
      const results = analyzeGameHealth(mockGameData)
      const suggestions = getImprovedAssignmentSuggestions(mockGameData, results)

      // Should suggest adding players to loved games
      expect(suggestions.some((s) => s.includes('games they love'))).toBe(true)
    })

    it('should check minimum player requirements', () => {
      // Create data with game that has too few players
      const gameWithTooFewPlayers = {
        ...mockGameData,
        assignments: [
          {
            userId: 'user1',
            gameId: '2', // Game2 needs 3 players minimum
            eventId: 'event1',
            name: 'John Doe',
          },
        ],
      }

      const results = analyzeGameHealth(gameWithTooFewPlayers)
      const suggestions = getImprovedAssignmentSuggestions(gameWithTooFewPlayers, results)

      // Should suggest adding more players to game2
      expect(suggestions.some((s) => s.includes('Game 2') && s.includes('more player'))).toBe(true)
    })

    it('should check maximum player requirements', () => {
      // Create data with game that has too many players
      const gameWithTooManyPlayers = {
        ...mockGameData,
        assignments: [
          {
            userId: 'user1',
            gameId: '1', // Game1 has max 4 players
            eventId: 'event1',
            name: 'John Doe',
          },
          {
            userId: 'user2',
            gameId: '1',
            eventId: 'event1',
            name: 'Jane Smith',
          },
          {
            userId: 'user3',
            gameId: '1',
            eventId: 'event1',
            name: 'Bob Johnson',
          },
          {
            userId: 'user4',
            gameId: '1',
            eventId: 'event1',
            name: 'Extra User 1',
          },
          {
            userId: 'user5',
            gameId: '1',
            eventId: 'event1',
            name: 'Extra User 2',
          },
        ],
      }

      const results = analyzeGameHealth(gameWithTooManyPlayers)
      const suggestions = getImprovedAssignmentSuggestions(gameWithTooManyPlayers, results)

      // Should suggest removing players from game1
      expect(suggestions.some((s) => s.includes('Game 1') && s.includes('too many'))).toBe(true)
    })
  })
})
