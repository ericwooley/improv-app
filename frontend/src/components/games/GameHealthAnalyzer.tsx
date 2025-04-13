import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Grid,
  List,
  ListItem,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import {
  analyzeGameHealth,
  calculateOverallHealthScore,
  getImprovedAssignmentSuggestions,
  GameData,
} from '../../utils/gameHealthUtils'

interface GameHealthAnalyzerProps {
  gameData: GameData
}

const GameHealthAnalyzer: React.FC<GameHealthAnalyzerProps> = ({ gameData }) => {
  // Analyze the game data
  const playerProblems = analyzeGameHealth(gameData)
  const healthScore = calculateOverallHealthScore(playerProblems)
  const suggestions = getImprovedAssignmentSuggestions(gameData, playerProblems)

  // Get color based on health score
  const getScoreColor = (score: number): 'success' | 'warning' | 'error' => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  const scoreColor = getScoreColor(healthScore)

  // Get icon based on severity
  const getSeverityIcon = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return <ErrorIcon fontSize="small" color="error" />
      case 'medium':
        return <WarningIcon fontSize="small" color="warning" />
      case 'low':
        return <WarningIcon fontSize="small" color="info" />
    }
  }

  // Group players by type (registered users vs walk-ins)
  const walkInPlayers = playerProblems.filter((player) => {
    const playerId = player.userId
    const isWalkIn = gameData.players.find((p) => p.userId === playerId)?.isWalkIn || false
    return isWalkIn
  })

  const registeredPlayers = playerProblems.filter((player) => {
    const playerId = player.userId
    const isWalkIn = gameData.players.find((p) => p.userId === playerId)?.isWalkIn || false
    return !isWalkIn
  })

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Health Score Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Game Assignment Health
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flexGrow: 1, mr: 2 }}>
              <LinearProgress
                variant="determinate"
                value={healthScore}
                color={scoreColor}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="h4" color={`${scoreColor}.main`} fontWeight="bold">
              {healthScore.toFixed(0)}
            </Typography>
          </Box>

          <Typography color="text.secondary">
            {healthScore >= 80
              ? 'Game assignments are well balanced and players are generally satisfied.'
              : healthScore >= 60
              ? 'Game assignments have some issues that could be improved.'
              : 'Game assignments have significant issues that should be addressed.'}
          </Typography>
        </Box>

        {/* Improvement Suggestions */}
        {suggestions.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Suggested Improvements
            </Typography>
            <List
              dense
              sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              {suggestions.map((suggestion, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem>
                    <Typography variant="body2">• {suggestion}</Typography>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {/* Player Analysis */}
        <Typography variant="h6" gutterBottom>
          Player Analysis
        </Typography>

        {/* Registered Players Section */}
        {registeredPlayers.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Registered Members
            </Typography>
            <Grid container spacing={2}>
              {registeredPlayers.map((player) => (
                <Grid size={6} key={player.userId}>
                  <Card variant="outlined" sx={{ mb: 2, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {player.playerName}
                        </Typography>
                        <Chip
                          label={`Happiness: ${player.happinessScore}`}
                          color={
                            player.happinessScore > 0 ? 'success' : player.happinessScore < 0 ? 'error' : 'default'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      {player.problems.length === 0 ? (
                        <Alert icon={<CheckCircleIcon />} severity="success" sx={{ mt: 1 }}>
                          No issues detected
                        </Alert>
                      ) : (
                        <>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Issues found:
                          </Typography>
                          <List dense disablePadding>
                            {player.problems.map((problem, index) => (
                              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {getSeverityIcon(problem.severity)}
                                  <Typography variant="body2" sx={{ ml: 1 }}>
                                    {problem.description}
                                  </Typography>
                                </Box>
                              </ListItem>
                            ))}
                          </List>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Walk-in Players Section */}
        {walkInPlayers.length > 0 && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              Walk-in Attendees
            </Typography>
            <Grid container spacing={2}>
              {walkInPlayers.map((player) => (
                <Grid size={6} key={player.userId}>
                  <Card variant="outlined" sx={{ mb: 2, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                          <Typography variant="subtitle1" fontWeight="bold">
                            {player.playerName}
                          </Typography>
                        </Box>
                        <Chip label="Walk-in" color="secondary" size="small" variant="outlined" />
                      </Box>

                      <Alert severity="info" sx={{ mt: 1 }}>
                        Walk-in attendees have no preference data
                      </Alert>

                      {player.problems.length > 0 && (
                        <>
                          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                            Potential issues:
                          </Typography>
                          <List dense disablePadding>
                            {player.problems.map((problem, index) => (
                              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {getSeverityIcon(problem.severity)}
                                  <Typography variant="body2" sx={{ ml: 1 }}>
                                    {problem.description}
                                  </Typography>
                                </Box>
                              </ListItem>
                            ))}
                          </List>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {/* Game Analysis */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Game Analysis
        </Typography>
        <Grid container spacing={2}>
          {gameData.games.map((game) => {
            const assignedPlayers = gameData.assignments.filter((a) => a.gameId === game.id)
            const playerCount = assignedPlayers.length
            const hasEnoughPlayers = playerCount >= game.minPlayers
            const hasTooManyPlayers = playerCount > game.maxPlayers

            return (
              <Grid size={4} key={game.id}>
                <Card variant="outlined" sx={{ mb: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {game.name}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      <Chip
                        label={`${playerCount}/${game.minPlayers}-${game.maxPlayers} players`}
                        color={!hasEnoughPlayers ? 'error' : hasTooManyPlayers ? 'warning' : 'success'}
                        size="small"
                      />
                      {game.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>

                    {!hasEnoughPlayers && (
                      <Alert severity="error" sx={{ mb: 1 }}>
                        Needs {game.minPlayers - playerCount} more player(s)
                      </Alert>
                    )}

                    {hasTooManyPlayers && (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        Has {playerCount - game.maxPlayers} too many player(s)
                      </Alert>
                    )}

                    {assignedPlayers.length > 0 ? (
                      <Typography variant="body2">
                        <strong>Assigned:</strong> {assignedPlayers.map((p) => p.name).join(', ')}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No players assigned
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Paper>
    </Box>
  )
}

export default GameHealthAnalyzer
