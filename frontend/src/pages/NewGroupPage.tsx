import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface Group {
  id: string
  name: string
  description: string
  createdAt: Date
}

interface NewGroupPageProps {
  onCreateGroup?: (group: Group) => void
}

const NewGroupPage = ({ onCreateGroup }: NewGroupPageProps) => {
  const navigate = useNavigate()
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

    // Call the callback if provided
    if (onCreateGroup) {
      onCreateGroup(groupToAdd)
    }

    // Navigate back to groups page
    navigate('/groups')
  }

  return (
    <div className="content-wrapper">
      <nav className="breadcrumb has-arrow-separator mb-5" aria-label="breadcrumbs">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/groups">Groups</Link>
          </li>
          <li className="is-active">
            <a href="#" aria-current="page">
              Create New Group
            </a>
          </li>
        </ul>
      </nav>

      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5">
        <div>
          <h1 className="title is-2">Create New Group</h1>
          <p className="subtitle is-5">Set up a new improv group</p>
        </div>
      </div>

      <div className="box">
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
          <div className="field is-grouped mt-5">
            <p className="control">
              <Link to="/groups" className="button is-light">
                Cancel
              </Link>
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
      </div>
    </div>
  )
}

export default NewGroupPage
