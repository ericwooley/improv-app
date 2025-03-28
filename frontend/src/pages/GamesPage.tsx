import { useState } from 'react'
import { PageHeader, CardGrid, ItemCard, EmptyState, ActionButton, TagList, InfoItem } from '../components'

interface Game {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  tags: string[]
}

interface GamesPageProps {
  initialGames?: Game[]
}

const GamesPage = ({ initialGames = [] }: GamesPageProps) => {
  const [games] = useState<Game[]>(initialGames)

  return (
    <div className="content-wrapper">
      <PageHeader title="Improv Games" subtitle="Browse and manage your collection of improv games" />

      {games.length > 0 && (
        <div className="mb-5">
          <ActionButton text="Create Game" to="/games/new" icon="fas fa-plus" />
        </div>
      )}

      {/* Games Grid */}
      {games.length > 0 ? (
        <CardGrid>
          {games.map((game) => (
            <div key={game.id} className="column is-4">
              <ItemCard id={game.id} title={game.name} description={game.description} footerLink={`/games/${game.id}`}>
                <InfoItem icon="fas fa-users" className="mb-3">
                  <span className="is-size-7">
                    {game.minPlayers}-{game.maxPlayers} players
                  </span>
                </InfoItem>

                <TagList tags={game.tags} />

                <div className="card-footer pt-3 is-flex is-justify-content-space-between">
                  <ActionButton text="View" to={`/games/${game.id}`} variant="info" outlined icon="fas fa-eye" />
                  <ActionButton text="Delete" variant="danger" outlined icon="fas fa-trash" />
                </div>
              </ItemCard>
            </div>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          message="No games have been added yet."
          actionText="Add Your First Game"
          actionLink="/games/new"
          actionIcon="fas fa-plus"
        />
      )}
    </div>
  )
}

export default GamesPage
