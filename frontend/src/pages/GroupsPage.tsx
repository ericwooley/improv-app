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
  const [groups] = useState<Group[]>(initialGroups)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="content-wrapper">
      <nav className="breadcrumb has-arrow-separator mb-5" aria-label="breadcrumbs">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li className="is-active">
            <a href="#" aria-current="page">
              Groups
            </a>
          </li>
        </ul>
      </nav>

      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5">
        <div>
          <h1 className="title is-2">Improv Groups</h1>
          <p className="subtitle is-5">Manage and explore your improv groups</p>
        </div>
        <div>
          <Link to="/groups/new" className="button is-primary is-medium">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Create Group</span>
          </Link>
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
          <Link to="/groups/new" className="button is-primary">
            <span className="icon">
              <i className="fas fa-plus"></i>
            </span>
            <span>Create Your First Group</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default GroupsPage
