import { PageHeader, CardGrid, EmptyState, ActionButton } from '../components'
import { GroupCard } from '../components/GroupCard'
import { useGetGroupsQuery } from '../store/api/groupsApi'

const GroupsPage = () => {
  const {
    data: groupsResponse,
    isLoading,
    error,
  } = useGetGroupsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  })
  const groups = groupsResponse?.data || []

  return (
    <div className="content-wrapper">
      <PageHeader title="Improv Groups" subtitle="Manage and explore your improv groups" />

      {groups.length > 0 && (
        <div className="mb-5">
          <ActionButton text="Create Group" to="/groups/new" icon="fas fa-plus" />
        </div>
      )}

      {isLoading ? (
        <div className="has-text-centered">
          <span className="icon is-large">
            <i className="fas fa-spinner fa-pulse"></i>
          </span>
        </div>
      ) : error ? (
        <div className="notification is-danger">
          <p>Error loading groups. Please try again later.</p>
        </div>
      ) : groups.length > 0 ? (
        <CardGrid>
          {groups.map((group) => (
            <GroupCard key={group.ID} group={group} />
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          message="You haven't created any groups yet."
          actionText="Create Your First Group"
          actionLink="/groups/new"
          actionIcon="fas fa-plus"
        />
      )}
    </div>
  )
}

export default GroupsPage
