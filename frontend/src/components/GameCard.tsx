import { Card, CardContent, CardHeader, CardActions, Button, Typography, Box, Divider } from '@mui/material'
import { Link } from 'react-router-dom'
import InfoItem from './InfoItem'
import TagList from './TagList'
import {
  People as PeopleIcon,
  Public as PublicIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'

export interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  public?: boolean
  tags?: string[]
  ownedByGroup?: boolean
}

interface GameCardProps {
  game: Game
}

const GameCard = ({ game }: GameCardProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}>
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
        </Box>

        {game.tags && game.tags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <TagList tags={game.tags} />
          </Box>
        )}
      </CardContent>

      <Box sx={{ mt: 'auto' }}>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', py: 1 }}>
          <Button
            component={Link}
            to={`/games/${game.id}`}
            color="primary"
            size="small"
            variant="contained"
            endIcon={<ArrowForwardIcon />}>
            View
          </Button>
        </CardActions>
      </Box>
    </Card>
  )
}

export default GameCard
