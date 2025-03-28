import { useState } from 'react'
import { Link } from 'react-router-dom'

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
      <div className="is-flex is-flex-direction-column-mobile is-justify-content-space-between is-align-items-start-mobile mb-5">
        <div className="mb-4-mobile">
          <h1 className="title is-2">Improv Games</h1>
          <p className="subtitle is-5">Browse and manage your collection of improv games</p>
        </div>
      </div>

      {games.length > 0 && (
        <div className="mb-5">
          <Link to="/games/new" className="button is-primary">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Create Game</span>
          </Link>
        </div>
      )}

      {/* Games Grid */}
      {games.length > 0 ? (
        <div className="columns is-multiline">
          {games.map((game) => (
            <div key={game.id} className="column is-4" data-game-id={game.id}>
              <div className="card h-100">
                <div className="card-content">
                  <h2 className="title">{game.name}</h2>
                  <p className="subtitle is-6 has-text-grey mb-4">{game.description}</p>
                  <div className="is-flex is-align-items-center mb-3">
                    <span className="icon has-text-info mr-2 is-small">
                      <i className="fas fa-users"></i>
                    </span>
                    <span className="is-size-7">
                      {game.minPlayers}-{game.maxPlayers} players
                    </span>
                  </div>

                  {game.tags.length > 0 && (
                    <div className="tags mb-4">
                      {game.tags.map((tag, index) => (
                        <span key={index} className="tag is-info is-light">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="card-footer pt-3 is-flex is-justify-content-space-between">
                    <Link to={`/games/${game.id}`} className="button is-info is-outlined">
                      <span className="icon">
                        <i className="fas fa-eye"></i>
                      </span>
                      <span>View</span>
                    </Link>
                    <button className="button is-danger is-outlined">
                      <span className="icon">
                        <i className="fas fa-trash"></i>
                      </span>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="notification is-light has-text-centered p-6">
          <p className="mb-4">No games have been added yet.</p>
          <Link to="/games/new" className="button is-primary">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Add Your First Game</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default GamesPage
