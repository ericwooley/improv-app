import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import { Link } from 'react-router-dom'
import InfoItem from './InfoItem'
import TagList from './TagList'
import { motion } from 'framer-motion'
import {
  People as PeopleIcon,
  Public as PublicIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Mood as MoodIcon,
} from '@mui/icons-material'
import { useSetGameStatusMutation, useGetGameStatusQuery } from '../store/api/gamesApi'

export interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  public?: boolean
  tags?: string[]
  ownedByGroup?: boolean
  animationDirection?: 'up' | 'down' | null
}

interface GameCardProps {
  game: Game
  showViewButton?: boolean
  onClick?: () => void
  isSelected?: boolean
  onAddGame?: () => void
}

// Create a motion component using MUI Card
const MotionCard = motion(Card)

const GameCard = ({ game, showViewButton = true, onClick, isSelected, onAddGame }: GameCardProps) => {
  const { data: statusData } = useGetGameStatusQuery(game.id)
  const [setGameStatus, { isLoading }] = useSetGameStatusMutation()

  const handleStatusChange = async (event: SelectChangeEvent) => {
    const newStatus = event.target.value

    try {
      await setGameStatus({ gameId: game.id, status: newStatus }).unwrap()
    } catch (error) {
      console.error('Failed to update game status:', error)
    }
  }

  const statusOptions = [
    '',
    'I Love playing this',
    'I Need to practice this',
    'I dont like this game',
    'I want to try this game',
    'No opinion on this game',
  ]

  const currentStatus = statusData?.data?.status || ''

  return (
    <MotionCard
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        border: isSelected ? '2px solid' : '1px solid',
        borderColor: isSelected ? 'primary.main' : 'divider',
        '&:hover': onClick
          ? {
              borderColor: 'primary.main',
              boxShadow: 1,
            }
          : {},
        position: 'relative',
      }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      layout
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}>
      {onAddGame && (
        <IconButton
          size="small"
          color="primary"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
            },
            zIndex: 1,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onAddGame()
          }}
          aria-label="add game to event">
          <AddIcon />
        </IconButton>
      )}

      <CardHeader
        title={game.name}
        sx={{
          pb: 1,
          '& .MuiCardHeader-title': {
            fontWeight: 600,
          },
        }}
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {game.description}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <InfoItem icon={<PeopleIcon />}>
            <Typography variant="body2">
              {game.minPlayers}-{game.maxPlayers} players
            </Typography>
          </InfoItem>

          {game.public && (
            <InfoItem icon={<PublicIcon />}>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                Public
              </Typography>
            </InfoItem>
          )}

          {game.ownedByGroup && (
            <InfoItem icon={<CheckCircleIcon />}>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                Owned by Group
              </Typography>
            </InfoItem>
          )}

          <Box sx={{ mt: 2 }}>
            <InfoItem icon={<MoodIcon />}>
              <FormControl
                size="small"
                fullWidth
                onClick={(e) => e.stopPropagation()} // Prevent card click when using dropdown
              >
                <Select
                  value={currentStatus}
                  onChange={handleStatusChange}
                  displayEmpty
                  disabled={isLoading}
                  variant="outlined"
                  size="small"
                  sx={{
                    minWidth: 220,
                  }}>
                  <MenuItem value="">
                    <em>How do you feel about this game?</em>
                  </MenuItem>
                  {statusOptions
                    .filter((option) => option !== '')
                    .map((statusOption) => (
                      <MenuItem key={statusOption} value={statusOption}>
                        {statusOption}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </InfoItem>
          </Box>
        </Box>

        {game.tags && game.tags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <TagList tags={game.tags} />
          </Box>
        )}
      </CardContent>
      {showViewButton && (
        <Box sx={{ mt: 'auto' }}>
          <Divider />
          <CardActions sx={{ justifyContent: 'flex-end', py: 1 }}>
            <Button
              component={Link}
              to={`/games/${game.id}`}
              color="primary"
              size="small"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={(e) => e.stopPropagation()}>
              View
            </Button>
          </CardActions>
        </Box>
      )}
    </MotionCard>
  )
}

export default GameCard
