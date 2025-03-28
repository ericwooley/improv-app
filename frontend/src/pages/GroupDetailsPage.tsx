import { useParams } from 'react-router-dom'
import { useGetGroupQuery } from '../store/api/groupsApi'
import { PageHeader, Breadcrumb, ActionButton, InfoItem, formatDate } from '../components'

const GroupDetailsPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const { data: groupResponse, isLoading, error } = useGetGroupQuery(groupId || '')

  if (isLoading) {
    return (
      <div className="content-wrapper">
        <div className="has-text-centered">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-pulse"></i>
          </span>
        </div>
      </div>
    )
  }

  if (error || !groupResponse?.data) {
    return (
      <div className="content-wrapper">
        <div className="notification is-danger">
          <p>Error loading group details. Please try again later.</p>
        </div>
      </div>
    )
  }

  const { group, members, userRole } = groupResponse.data

  return (
    <div className="content-wrapper">
      <Breadcrumb
        items={[
          { label: 'Groups', to: '/groups' },
          { label: group.Name, active: true },
        ]}
      />

      <PageHeader title={group.Name} subtitle={group.Description} />

      <div className="columns">
        <div className="column is-8">
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">
                <span className="icon mr-2">
                  <i className="fas fa-info-circle"></i>
                </span>
                Group Information
              </p>
            </header>
            <div className="card-content">
              <InfoItem icon="fas fa-calendar-alt">Created {formatDate(new Date(group.CreatedAt))}</InfoItem>
              <InfoItem icon="fas fa-user-shield">Your Role: {userRole}</InfoItem>
            </div>
          </div>

          <div className="card mt-5">
            <header className="card-header">
              <p className="card-header-title">
                <span className="icon mr-2">
                  <i className="fas fa-users"></i>
                </span>
                Members
              </p>
            </header>
            <div className="card-content">
              <div className="table-container">
                <table className="table is-fullwidth">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id}>
                        <td>{`${member.firstName} ${member.lastName}`}</td>
                        <td>{member.email}</td>
                        <td>
                          <span className={`tag ${member.role === 'admin' ? 'is-danger' : 'is-info'}`}>
                            {member.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="column is-4">
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">
                <span className="icon mr-2">
                  <i className="fas fa-cog"></i>
                </span>
                Actions
              </p>
            </header>
            <div className="card-content">
              <div className="buttons is-flex is-flex-direction-column">
                <ActionButton
                  text="Create Event"
                  to={`/events/new?groupId=${group.ID}`}
                  icon="fas fa-calendar-plus"
                  fullWidth
                  className="mb-3"
                />
                {userRole === 'admin' && (
                  <>
                    <ActionButton
                      text="Edit Group"
                      to={`/groups/${group.ID}/edit`}
                      icon="fas fa-edit"
                      variant="danger"
                      fullWidth
                      className="mb-3"
                    />
                    <ActionButton
                      text="Manage Members"
                      to={`/groups/${group.ID}/members`}
                      icon="fas fa-user-cog"
                      variant="info"
                      fullWidth
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GroupDetailsPage
