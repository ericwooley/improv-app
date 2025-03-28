import { Card, CardContent, CardHeader, CardActions, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import InfoItem from './InfoItem'
import TagList from './TagList'

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
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={game.name} />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {game.description}
        </Typography>

        <InfoItem icon="fas fa-users">
          <Typography variant="body2">
            {game.minPlayers}-{game.maxPlayers} players
          </Typography>
        </InfoItem>

        {game.public && (
          <InfoItem icon="fas fa-globe">
            <Typography variant="body2" color="primary.main">
              Public
            </Typography>
          </InfoItem>
        )}

        {game.ownedByGroup && (
          <InfoItem icon="fas fa-check-circle">
            <Typography variant="body2" color="success.main">
              Owned by Group
            </Typography>
          </InfoItem>
        )}

        {game.tags && <TagList tags={game.tags} />}
      </CardContent>

      <CardActions sx={{ pt: 2, justifyContent: 'flex-end' }}>
        <Button component={Link} to={`/games/${game.id}`} color="primary" size="small">
          View
        </Button>
      </CardActions>
    </Card>
  )
}

export default GameCard
