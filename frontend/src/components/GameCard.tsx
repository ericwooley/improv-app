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
import React from 'react'
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
  Favorite as FavoriteIcon,
  AccessTime as AccessTimeIcon,
  ThumbDown as ThumbDownIcon,
  NewReleases as NewReleasesIcon,
  NoAccounts as NoAccountsIcon,
} from '@mui/icons-material'
import { useSetGameStatusMutation, useGetGameStatusQuery } from '../store/api/gamesApi'
import { useEffect, useRef, useState } from 'react'

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
  isRemoving?: boolean
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

const GameCard = React.memo(({ game, showViewButton = true, onClick, isSelected, onAddGame }: GameCardProps) => {
  const [shouldFetchStatus, setShouldFetchStatus] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Skip the query until the card has been visible for 250ms
  const { data: statusData, isLoading: isStatusLoading } = useGetGameStatusQuery(game.id, {
    skip: !shouldFetchStatus,
  })
  const [setGameStatus, { isLoading: isUpdatingStatus }] = useSetGameStatusMutation()

  // Combined loading state
  const isStatusDisabled = isStatusLoading || isUpdatingStatus || !shouldFetchStatus

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (entry.isIntersecting) {
          // Start timer when card becomes visible
          timerRef.current = setTimeout(() => {
            setShouldFetchStatus(true)
          }, 250)
        } else {
          // Clear timer if card goes out of view
          if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
          }
        }
      },
      { threshold: 0.1 } // Consider visible when at least 10% is in view
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => {
      observer.disconnect()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleStatusChange = async (event: SelectChangeEvent) => {
    const newStatus = event.target.value

    try {
      await setGameStatus({ gameId: game.id, status: newStatus }).unwrap()
      // If this is in the unrated list on homepage, mark it for removal
      if (cardRef.current && cardRef.current.closest('[data-unrated-games-list="true"]')) {
        // Animate out before calling onClick (which will remove from React state)
        const cardElement = cardRef.current
        if (cardElement) {
          // Trigger a nice animation before removing
          cardElement.style.transition = 'all 0.4s ease-out'
          cardElement.style.transform = 'translateY(-20px) scale(0.9)'
          cardElement.style.opacity = '0'

          // After animation completes, call onClick to remove from list
          setTimeout(() => {
            if (onClick) {
              onClick()
            }
          }, 300)

          // Prevent event propagation so the card's onClick doesn't fire
          event.stopPropagation()
          return
        }

        if (onClick) {
          // Just call onClick if we couldn't animate
          onClick()
        }
      }
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

  // Status icon and color mapping
  const getStatusIconAndColor = (status: string) => {
    switch (status) {
      case 'I Love playing this':
        return { icon: <FavoriteIcon />, color: 'success.main' }
      case 'I Need to practice this':
        return { icon: <AccessTimeIcon />, color: 'warning.main' }
      case 'I dont like this game':
        return { icon: <ThumbDownIcon />, color: 'error.dark' }
      case 'I want to try this game':
        return { icon: <NewReleasesIcon />, color: 'info.main' }
      case 'No opinion on this game':
        return { icon: <NoAccountsIcon />, color: 'text.secondary' }
      default:
        return { icon: <MoodIcon />, color: 'text.secondary' }
    }
  }

  const { icon: statusIcon, color: statusColor } = getStatusIconAndColor(currentStatus)

  return (
    <MotionCard
      ref={cardRef}
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
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      layout
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      data-testid={`game-card-${game.id}`}>
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
          aria-label="add game to event"
          data-testid="game-card-add-button">
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
        data-testid="game-card-header"
      />
      <Divider />
      <CardContent sx={{ flexGrow: 1, pt: 2 }} data-testid="game-card-content">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} data-testid="game-card-description">
          {game.description}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <InfoItem icon={<PeopleIcon />}>
            <Typography variant="body2" data-testid="game-card-players">
              {game.minPlayers}-{game.maxPlayers} players
            </Typography>
          </InfoItem>

          {game.public && (
            <InfoItem icon={<PublicIcon />}>
              <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }} data-testid="game-card-public">
                Public
              </Typography>
            </InfoItem>
          )}

          {game.ownedByGroup && (
            <InfoItem icon={<CheckCircleIcon />}>
              <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }} data-testid="game-card-owned">
                Owned by Group
              </Typography>
            </InfoItem>
          )}

          <Box sx={{ mt: 2 }}>
            <InfoItem
              icon={
                <Box component="span" sx={{ color: statusColor }}>
                  {statusIcon}
                </Box>
              }>
              <FormControl
                size="small"
                fullWidth
                onClick={(e) => e.stopPropagation()} // Prevent card click when using dropdown
                data-testid="game-card-status-control">
                <Select
                  value={currentStatus}
                  onChange={handleStatusChange}
                  displayEmpty
                  disabled={isStatusDisabled}
                  variant="outlined"
                  size="small"
                  data-testid="game-card-status-select"
                  sx={{
                    minWidth: 220,
                    ...(currentStatus && { '& .MuiOutlinedInput-notchedOutline': { borderColor: statusColor } }),
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: currentStatus ? statusColor : 'inherit',
                    },
                  }}>
                  <MenuItem value="" data-testid="game-card-status-default">
                    <em>How do you feel about this game?</em>
                  </MenuItem>
                  {statusOptions
                    .filter((option) => option !== '')
                    .map((statusOption) => (
                      <MenuItem
                        key={statusOption}
                        value={statusOption}
                        data-testid={`game-card-status-option-${statusOption.toLowerCase().replace(/\s+/g, '-')}`}>
                        {statusOption}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </InfoItem>
          </Box>
        </Box>

        {game.tags && game.tags.length > 0 && (
          <Box sx={{ mt: 2 }} data-testid="game-card-tags">
            <TagList tags={game.tags} />
          </Box>
        )}
      </CardContent>
      {showViewButton && (
        <Box sx={{ mt: 'auto' }}>
          <Divider />
          <CardActions sx={{ justifyContent: 'flex-end', py: 1 }} data-testid="game-card-actions">
            <Button
              component={Link}
              to={`/games/${game.id}`}
              color="primary"
              size="small"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={(e) => e.stopPropagation()}
              data-testid="game-card-view-button">
              View
            </Button>
          </CardActions>
        </Box>
      )}
    </MotionCard>
  )
})

export default GameCard
