import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Group {
  id: string
  name: string
  description: string
  createdAt: Date
}

interface GroupsPageProps {
  initialGroups?: Group[]
}

const GroupsPage = ({ initialGroups = [] }: GroupsPageProps) => {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
  })

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault()

    // Create a new group object
    const groupToAdd: Group = {
      id: Date.now().toString(), // temporary ID until backend integration
      name: newGroup.name,
      description: newGroup.description,
      createdAt: new Date(),
    }

    // Add the new group to the state
    setGroups([...groups, groupToAdd])

    // Reset form and close modal
    setNewGroup({
      name: '',
      description: '',
    })
    setIsCreateModalOpen(false)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="content-wrapper">
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5">
        <div>
          <h1 className="title is-2">Improv Groups</h1>
          <p className="subtitle is-5">Manage and explore your improv groups</p>
        </div>
        <div>
          <button onClick={() => setIsCreateModalOpen(true)} className="button is-primary is-medium">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="columns is-multiline">
          {groups.map((group) => (
            <div key={group.id} className="column is-4">
              <div className="card h-100">
                <div className="card-content">
                  <h2 className="title">{group.name}</h2>
                  <p className="subtitle has-text-grey">{group.description}</p>
                  <div className="is-flex is-align-items-center mb-4">
                    <span className="icon has-text-info mr-2">
                      <i className="fas fa-calendar-alt"></i>
                    </span>
                    <span className="is-size-7">Created {formatDate(group.createdAt)}</span>
                  </div>
                </div>
                <div className="card-footer">
                  <Link
                    to={`/groups/${group.id}`}
                    className="card-footer-item is-flex is-justify-content-space-between">
                    <span>View Details</span>
                    <span className="icon">
                      <i className="fas fa-arrow-right"></i>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="notification is-light has-text-centered p-6">
          <p className="mb-4">You haven't created any groups yet.</p>
          <button onClick={() => setIsCreateModalOpen(true)} className="button is-primary">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Create Your First Group</span>
          </button>
        </div>
      )}

      {/* Create Group Modal */}
      <div className={`modal ${isCreateModalOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setIsCreateModalOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">
              <span className="icon mr-2">
                <i className="fas fa-users"></i>
              </span>
              Create New Group
            </p>
            <button className="delete" aria-label="close" onClick={() => setIsCreateModalOpen(false)}></button>
          </header>
          <section className="modal-card-body">
            <form onSubmit={handleCreateGroup}>
              <div className="field">
                <label htmlFor="name" className="label">
                  Group Name
                </label>
                <div className="control has-icons-left">
                  <input
                    type="text"
                    id="name"
                    required
                    className="input"
                    placeholder="My Improv Group"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  />
                  <span className="icon is-small is-left">
                    <i className="fas fa-theater-masks"></i>
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
                    rows={3}
                    className="textarea"
                    placeholder="Tell us about your group..."
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}></textarea>
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
                    <span>Create Group</span>
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

export default GroupsPage
