import { RSVP, GamePreference, PlayerAssignment } from '../store/api/eventsApi'

export interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  orderIndex: number
  tags: string[]
}

export interface GameData {
  games: Game[]
  players: RSVP[]
  assignments: PlayerAssignment[]
  preferences: GamePreference[]
}

export interface PlayerProblem {
  userId: string
  playerName: string
  problems: {
    type: 'disliked-game' | 'too-few-games' | 'too-many-games' | 'unbalanced-assignments'
    severity: 'low' | 'medium' | 'high'
    description: string
    gameId?: string
    score: number
  }[]
  happinessScore: number
}

// Preference score values
const PREFERENCE_SCORES: Record<string, number> = {
  'I Love playing this': 2,
  'I Need to practice this': 1,
  neutral: 0,
  'I dont like this game': -2,
  // Default if no preference found
  default: 0,
}

/**
 * Analyzes game assignments and preferences to identify potential problems
 * @param data Object containing games, players, assignments and preferences
 * @returns Array of player problems and health insights
 */
export const analyzeGameHealth = (data: GameData): PlayerProblem[] => {
  const { games, players, assignments, preferences } = data

  // Count assignments per player
  const assignmentCounts: Record<string, number> = {}
  players.forEach((player) => {
    assignmentCounts[player.userId] = 0
  })

  assignments.forEach((assignment) => {
    if (assignmentCounts[assignment.userId] !== undefined) {
      assignmentCounts[assignment.userId]++
    }
  })

  // Calculate average assignments per player
  const totalAssignments = Object.values(assignmentCounts).reduce((sum, count) => sum + count, 0)
  const averageAssignments = totalAssignments / (Object.keys(assignmentCounts).length || 1)

  // Get player name lookup
  const playerNames: Record<string, string> = {}
  players.forEach((player) => {
    playerNames[player.userId] = `${player.firstName} ${player.lastName}`
  })

  // Process each player
  return players.map((player) => {
    const playerProblems: PlayerProblem['problems'] = []
    let happinessScore = 0

    // Get player's assignments
    const playerAssignments = assignments.filter((a) => a.userId === player.userId)

    // Check number of assignments
    const assignmentCount = assignmentCounts[player.userId] || 0
    if (assignmentCount < averageAssignments - 0.5) {
      const gap = averageAssignments - assignmentCount
      const severity = gap > 1.5 ? 'high' : gap > 0.75 ? 'medium' : 'low'
      playerProblems.push({
        type: 'too-few-games',
        severity,
        description: `Assigned to ${assignmentCount} games, which is below the average of ${averageAssignments.toFixed(
          1
        )}`,
        score: -Math.round(gap * 10),
      })
    } else if (assignmentCount > averageAssignments + 0.5) {
      const gap = assignmentCount - averageAssignments
      const severity = gap > 1.5 ? 'high' : gap > 0.75 ? 'medium' : 'low'
      playerProblems.push({
        type: 'too-many-games',
        severity,
        description: `Assigned to ${assignmentCount} games, which is above the average of ${averageAssignments.toFixed(
          1
        )}`,
        score: -Math.round(gap * 5), // Less penalty than too few games
      })
    }

    // Check for disliked games
    playerAssignments.forEach((assignment) => {
      const game = games.find((g) => g.id === assignment.gameId)
      const preference = preferences.find((p) => p.userId === player.userId && p.gameId === assignment.gameId)

      // Calculate happiness for this assignment
      const preferenceStatus = preference?.status || 'default'
      const preferenceScore =
        PREFERENCE_SCORES[preferenceStatus] !== undefined
          ? PREFERENCE_SCORES[preferenceStatus]
          : PREFERENCE_SCORES.default

      // Add to overall happiness score
      happinessScore += preferenceScore

      // Check if assigned to a disliked game
      if (preference?.status === 'I dont like this game') {
        playerProblems.push({
          type: 'disliked-game',
          severity: 'high',
          description: `Assigned to a disliked game: ${game?.name || assignment.gameId}`,
          gameId: assignment.gameId,
          score: -20,
        })
      }
    })

    // Calculate missing preferred games
    const lovedGames = preferences
      .filter((p) => p.userId === player.userId && p.status === 'I Love playing this')
      .map((p) => p.gameId)

    const assignedGameIds = playerAssignments.map((a) => a.gameId)
    const missingLovedGames = lovedGames.filter((gameId) => !assignedGameIds.includes(gameId))

    if (missingLovedGames.length > 0) {
      const missingGameNames = missingLovedGames
        .map((gameId) => games.find((g) => g.id === gameId)?.name || gameId)
        .join(', ')

      playerProblems.push({
        type: 'unbalanced-assignments',
        severity: missingLovedGames.length > 1 ? 'high' : 'medium',
        description: `Not assigned to ${missingLovedGames.length} loved game(s): ${missingGameNames}`,
        score: -10 * missingLovedGames.length,
      })
    }

    return {
      userId: player.userId,
      playerName: playerNames[player.userId] || player.userId,
      problems: playerProblems,
      happinessScore,
    }
  })
}

/**
 * Calculates an overall health score for the game assignments
 * @param playerProblems Array of player problems from analyzeGameHealth
 * @returns A score from 0-100 representing overall health
 */
export const calculateOverallHealthScore = (playerProblems: PlayerProblem[]): number => {
  if (playerProblems.length === 0) return 100

  // Sum of all problems scores (they're negative values)
  const totalProblemScore = playerProblems.reduce(
    (sum, player) => sum + player.problems.reduce((s, p) => s + p.score, 0),
    0
  )

  // Sum of happiness scores
  const totalHappinessScore = playerProblems.reduce((sum, player) => sum + player.happinessScore, 0)

  // Base score is 70, then add happiness and subtract problems
  // We'll cap between 0 and 100
  const score = 70 + totalHappinessScore * 3 + totalProblemScore

  return Math.max(0, Math.min(100, score))
}

/**
 * Gets suggestions for improving game assignments
 * @param data Game data
 * @param playerProblems Array of player problems from analyzeGameHealth
 * @returns Array of suggestions to improve assignments
 */
export const getImprovedAssignmentSuggestions = (data: GameData, playerProblems: PlayerProblem[]): string[] => {
  const suggestions: string[] = []
  const { games, assignments } = data

  // Find players with too few games
  const playersWithTooFewGames = playerProblems.filter((p) =>
    p.problems.some((problem) => problem.type === 'too-few-games')
  )

  // Find players with disliked games
  const playersWithDislikedGames = playerProblems.filter((p) =>
    p.problems.some((problem) => problem.type === 'disliked-game')
  )

  // Find players with missing loved games
  const playersWithMissingLovedGames = playerProblems.filter((p) =>
    p.problems.some((problem) => problem.type === 'unbalanced-assignments')
  )

  // Generate suggestions
  if (playersWithTooFewGames.length > 0) {
    playersWithTooFewGames.forEach((player) => {
      suggestions.push(`Consider adding ${player.playerName} to more games to balance participation.`)
    })
  }

  if (playersWithDislikedGames.length > 0) {
    playersWithDislikedGames.forEach((player) => {
      const dislikedGameProblems = player.problems.filter((p) => p.type === 'disliked-game')
      dislikedGameProblems.forEach((problem) => {
        const game = games.find((g) => g.id === problem.gameId)
        suggestions.push(
          `Consider removing ${player.playerName} from "${game?.name || problem.gameId}" which they dislike.`
        )
      })
    })
  }

  if (playersWithMissingLovedGames.length > 0) {
    playersWithMissingLovedGames.forEach((player) => {
      const unbalancedProblems = player.problems.find((p) => p.type === 'unbalanced-assignments')
      if (unbalancedProblems) {
        suggestions.push(`Consider adding ${player.playerName} to games they love but aren't assigned to.`)
      }
    })
  }

  // Check for games with too few or too many players
  const gameAssignmentCounts: Record<string, number> = {}

  assignments.forEach((assignment) => {
    if (!gameAssignmentCounts[assignment.gameId]) {
      gameAssignmentCounts[assignment.gameId] = 0
    }
    gameAssignmentCounts[assignment.gameId]++
  })

  games.forEach((game) => {
    const playerCount = gameAssignmentCounts[game.id] || 0

    if (playerCount < game.minPlayers) {
      suggestions.push(
        `"${game.name}" needs at least ${game.minPlayers - playerCount} more player(s) to meet minimum requirements.`
      )
    } else if (playerCount > game.maxPlayers) {
      suggestions.push(
        `"${game.name}" has ${playerCount - game.maxPlayers} too many player(s) exceeding maximum capacity.`
      )
    }
  })

  return suggestions
}
