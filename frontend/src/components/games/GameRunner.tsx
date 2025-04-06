import { Box, Typography, Paper, Button } from '@mui/material'
import { useState } from 'react'

interface GameRunnerProps {
  eventId?: string
  isMC?: boolean
}

const GameRunner = ({ eventId, isMC = false }: GameRunnerProps) => {
  const [currentGame, setCurrentGame] = useState<string | null>(null)

  // This is a placeholder. In a real implementation, you would:
  // 1. Fetch the current game from the API
  // 2. Implement game logic
  // 3. Add controls for the MC to manage the game

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Game Runner
      </Typography>

      {currentGame ? (
        <Box>
          <Typography variant="body1" gutterBottom>
            Currently playing: {currentGame}
          </Typography>
          {isMC && (
            <Button variant="contained" color="secondary" onClick={() => setCurrentGame(null)}>
              End Game
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" gutterBottom>
            No game is currently running.
          </Typography>
          {isMC && (
            <Button variant="contained" color="primary" onClick={() => setCurrentGame('Sample Game')}>
              Start Game
            </Button>
          )}
        </Box>
      )}
    </Paper>
  )
}

export default GameRunner
