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
  const [games, setGames] = useState<Game[]>(initialGames)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newGame, setNewGame] = useState<{
    name: string
    description: string
    minPlayers: number
    maxPlayers: number
    tags: string
  }>({
    name: '',
    description: '',
    minPlayers: 2,
    maxPlayers: 8,
    tags: '',
  })

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault()

    // Create a new game object
    const gameToAdd: Game = {
      id: Date.now().toString(), // temporary ID until backend integration
      name: newGame.name,
      description: newGame.description,
      minPlayers: newGame.minPlayers,
      maxPlayers: newGame.maxPlayers,
      tags: newGame.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag),
    }

    // Add the new game to the state
    setGames([...games, gameToAdd])

    // Reset form and close modal
    setNewGame({
      name: '',
      description: '',
      minPlayers: 2,
      maxPlayers: 8,
      tags: '',
    })
    setIsCreateModalOpen(false)
  }

  return (
    <div className="content-wrapper">
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5">
        <div>
          <h1 className="title is-2">Improv Games</h1>
          <p className="subtitle is-5">Browse and manage your collection of improv games</p>
        </div>
        <div>
          <button onClick={() => setIsCreateModalOpen(true)} className="button is-primary is-medium">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Create Game</span>
          </button>
        </div>
      </div>

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
          <button onClick={() => setIsCreateModalOpen(true)} className="button is-primary">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Add Your First Game</span>
          </button>
        </div>
      )}

      {/* Create Game Modal */}
      <div className={`modal ${isCreateModalOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setIsCreateModalOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">
              <span className="icon mr-2">
                <i className="fas fa-dice"></i>
              </span>
              Create New Game
            </p>
            <button className="delete" aria-label="close" onClick={() => setIsCreateModalOpen(false)}></button>
          </header>
          <section className="modal-card-body">
            <form onSubmit={handleCreateGame}>
              <div className="field">
                <label htmlFor="name" className="label">
                  Game Name
                </label>
                <div className="control has-icons-left">
                  <input
                    type="text"
                    id="name"
                    required
                    className="input"
                    placeholder="Freeze Tag"
                    value={newGame.name}
                    onChange={(e) => setNewGame({ ...newGame, name: e.target.value })}
                  />
                  <span className="icon is-small is-left">
                    <i className="fas fa-gamepad"></i>
                  </span>
                </div>
              </div>
              <div className="field">
                <label htmlFor="description" className="label">
                  Description
                </label>
                <div className="control">
                  <textarea
                    id="description"
                    className="textarea"
                    placeholder="Explain how to play the game..."
                    value={newGame.description}
                    onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}></textarea>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label htmlFor="min_players" className="label">
                      Min Players
                    </label>
                    <div className="control has-icons-left">
                      <input
                        type="number"
                        id="min_players"
                        required
                        min="1"
                        className="input"
                        placeholder="2"
                        value={newGame.minPlayers}
                        onChange={(e) => setNewGame({ ...newGame, minPlayers: parseInt(e.target.value) })}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-user"></i>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label htmlFor="max_players" className="label">
                      Max Players
                    </label>
                    <div className="control has-icons-left">
                      <input
                        type="number"
                        id="max_players"
                        required
                        min="1"
                        className="input"
                        placeholder="8"
                        value={newGame.maxPlayers}
                        onChange={(e) => setNewGame({ ...newGame, maxPlayers: parseInt(e.target.value) })}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-users"></i>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="field">
                <label htmlFor="tags" className="label">
                  Tags
                </label>
                <div className="control has-icons-left">
                  <input
                    type="text"
                    id="tags"
                    className="input"
                    placeholder="warmup, scene, narrative (comma-separated)"
                    value={newGame.tags}
                    onChange={(e) => setNewGame({ ...newGame, tags: e.target.value })}
                  />
                  <span className="icon is-small is-left">
                    <i className="fas fa-tags"></i>
                  </span>
                </div>
              </div>
              <div className="field is-grouped is-grouped-right mt-5">
                <p className="control">
                  <button type="button" className="button is-light" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </button>
                </p>
                <p className="control">
                  <button type="submit" className="button is-primary">
                    <span className="icon">
                      <i className="fas fa-check"></i>
                    </span>
                    <span>Create Game</span>
                  </button>
                </p>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}

export default GamesPage
