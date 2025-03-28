import { PageHeader, EmptyState, ActionButton } from '../components'
import { GroupCard } from '../components/GroupCard'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { Box, CircularProgress, Alert } from '@mui/material'

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
    <Box sx={{ p: 3 }}>
      <PageHeader title="Improv Groups" subtitle="Manage and explore your improv groups" />

      {groups.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <ActionButton text="Create Group" to="/groups/new" icon="fas fa-plus" />
        </Box>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading groups. Please try again later.
        </Alert>
      ) : groups.length > 0 ? (
        groups.map((group) => <GroupCard key={group.ID} group={group} />)
      ) : (
        <EmptyState
          message="You haven't created any groups yet."
          actionText="Create Your First Group"
          actionLink="/groups/new"
          actionIcon="fas fa-plus"
        />
      )}
    </Box>
  )
}

export default GroupsPage
