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

// Extend RSVP type to include isWalkIn property
export interface ExtendedRSVP extends RSVP {
  isWalkIn?: boolean
}

export interface GameData {
  games: Game[]
  players: ExtendedRSVP[]
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

/**
 * Automatically assigns players to games to maximize happiness
 * @param data Object containing games, players and preferences
 * @returns Optimized list of player assignments
 */
export const autoAssignPlayers = (data: GameData): PlayerAssignment[] => {
  const { games, players, preferences, assignments } = data;
  const optimizedAssignments: PlayerAssignment[] = [];

  // Create a scoring matrix for each player-game combination
  const playerGameScores: Record<string, Record<string, number>> = {};

  // Initialize scores based on preferences
  players.forEach(player => {
    playerGameScores[player.userId] = {};
    games.forEach(game => {
      const preference = preferences.find(p => p.userId === player.userId && p.gameId === game.id);
      const preferenceStatus = preference?.status || 'default';
      const preferenceScore = PREFERENCE_SCORES[preferenceStatus] !== undefined
        ? PREFERENCE_SCORES[preferenceStatus]
        : PREFERENCE_SCORES.default;

      playerGameScores[player.userId][game.id] = preferenceScore;
    });
  });

  // Track assignments per player and per game
  const playerAssignmentCount: Record<string, number> = {};
  players.forEach(player => {
    playerAssignmentCount[player.userId] = 0;
  });

  const gameAssignmentCount: Record<string, number> = {};
  games.forEach(game => {
    gameAssignmentCount[game.id] = 0;
  });

  // Sort games by minimum player requirements (prioritize games that need more players)
  const sortedGames = [...games].sort((a, b) => b.minPlayers - a.minPlayers);

  // Get event ID from existing assignments, or use a placeholder
  const eventId = assignments.length > 0 ? assignments[0].eventId : 'event-id-placeholder';

  // First pass: Ensure minimum requirements are met for all games
  for (const game of sortedGames) {
    // Sort players by their preference for this game (highest score first)
    const playersByPreference = [...players]
      .map(player => ({
        player,
        score: playerGameScores[player.userId][game.id]
      }))
      .sort((a, b) => b.score - a.score);

    // Assign players until minimum requirement is met
    let assignedCount = 0;
    for (const { player, score } of playersByPreference) {
      // Skip players who dislike this game in the first pass if possible
      if (score < -1 && assignedCount >= game.minPlayers) continue;

      // Check if this game already has minimum players
      if (gameAssignmentCount[game.id] >= game.minPlayers) break;

      // Add assignment
      optimizedAssignments.push({
        userId: player.userId,
        gameId: game.id,
        name: `${player.firstName} ${player.lastName}`,
        eventId
      });

      playerAssignmentCount[player.userId]++;
      gameAssignmentCount[game.id]++;
      assignedCount++;
    }
  }

  // Second pass: Fill games up to optimal capacity with players who like them
  const averageGamesPerPlayer = games.length / players.length;
  const targetAssignmentsPerPlayer = Math.max(1, Math.floor(averageGamesPerPlayer));

  // Sort games by how close they are to max capacity (prioritize games that need fewer players)
  const remainingGames = [...games]
    .filter(game => gameAssignmentCount[game.id] < game.maxPlayers)
    .sort((a, b) => {
      const aRemainingCapacity = a.maxPlayers - gameAssignmentCount[a.id];
      const bRemainingCapacity = b.maxPlayers - gameAssignmentCount[b.id];
      return aRemainingCapacity - bRemainingCapacity;
    });

  for (const game of remainingGames) {
    // Skip if game is already at max capacity
    if (gameAssignmentCount[game.id] >= game.maxPlayers) continue;

    // Get players who aren't already assigned to this game
    const unassignedPlayers = players.filter(player =>
      !optimizedAssignments.some(a => a.userId === player.userId && a.gameId === game.id)
    );

    // Sort by preference score and then by number of current assignments (prefer players with fewer assignments)
    const sortedPlayers = unassignedPlayers
      .map(player => ({
        player,
        score: playerGameScores[player.userId][game.id],
        currentAssignments: playerAssignmentCount[player.userId]
      }))
      .sort((a, b) => {
        // First prioritize by preference score
        if (b.score !== a.score) return b.score - a.score;
        // Then prioritize players with fewer assignments
        return a.currentAssignments - b.currentAssignments;
      });

    // Assign players until max capacity or no more suitable players
    for (const { player, score } of sortedPlayers) {
      // Don't assign players to games they dislike
      if (score < 0) continue;

      // Stop if game is at max capacity
      if (gameAssignmentCount[game.id] >= game.maxPlayers) break;

      // Skip players who already have more than the target number of games
      if (playerAssignmentCount[player.userId] >= targetAssignmentsPerPlayer + 1) continue;

      // Add assignment
      optimizedAssignments.push({
        userId: player.userId,
        gameId: game.id,
        name: `${player.firstName} ${player.lastName}`,
        eventId
      });

      playerAssignmentCount[player.userId]++;
      gameAssignmentCount[game.id]++;
    }
  }

  // Third pass: Balance assignments to ensure all players have games
  const playersWithFewGames = players
    .filter(player => playerAssignmentCount[player.userId] < 1)
    .sort((a, b) => playerAssignmentCount[a.userId] - playerAssignmentCount[b.userId]);

  for (const player of playersWithFewGames) {
    // Find games that player doesn't hate and aren't at max capacity
    const possibleGames = games
      .filter(game => {
        const preference = playerGameScores[player.userId][game.id];
        const isAlreadyAssigned = optimizedAssignments.some(
          a => a.userId === player.userId && a.gameId === game.id
        );
        return !isAlreadyAssigned && preference > -2 && gameAssignmentCount[game.id] < game.maxPlayers;
      })
      .sort((a, b) => playerGameScores[player.userId][b.id] - playerGameScores[player.userId][a.id]);

    if (possibleGames.length > 0) {
      const bestGame = possibleGames[0];
      optimizedAssignments.push({
        userId: player.userId,
        gameId: bestGame.id,
        name: `${player.firstName} ${player.lastName}`,
        eventId
      });

      playerAssignmentCount[player.userId]++;
      gameAssignmentCount[bestGame.id]++;
    }
  }

  // Fourth pass: Final optimization to improve overall happiness
  const remainingCapacityGames = games.filter(game => gameAssignmentCount[game.id] < game.maxPlayers);

  if (remainingCapacityGames.length > 0) {
    // Find players who love games but aren't assigned to them
    players.forEach(player => {
      const lovedGames = preferences
        .filter(p => p.userId === player.userId && p.status === 'I Love playing this')
        .map(p => p.gameId);

      const assignedGameIds = optimizedAssignments
        .filter(a => a.userId === player.userId)
        .map(a => a.gameId);

      const missingLovedGames = lovedGames
        .filter(gameId => !assignedGameIds.includes(gameId))
        .filter(gameId => {
          const game = games.find(g => g.id === gameId);
          return game && gameAssignmentCount[gameId] < game.maxPlayers;
        });

      // Assign to loved games if possible
      for (const gameId of missingLovedGames) {
        if (playerAssignmentCount[player.userId] >= targetAssignmentsPerPlayer + 1) break;
        if (gameAssignmentCount[gameId] >= games.find(g => g.id === gameId)!.maxPlayers) continue;

        optimizedAssignments.push({
          userId: player.userId,
          gameId: gameId,
          name: `${player.firstName} ${player.lastName}`,
          eventId
        });

        playerAssignmentCount[player.userId]++;
        gameAssignmentCount[gameId]++;
      }
    });
  }

  return optimizedAssignments;
};
