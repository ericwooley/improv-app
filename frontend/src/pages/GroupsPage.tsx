import { PageHeader, ActionButton, GroupsList } from '../components'
import { useGetGroupsQuery } from '../store/api/groupsApi'
import { Box, Paper } from '@mui/material'

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
          <ActionButton testId="create-group-button" text="Create Group" to="/groups/new" icon="fas fa-plus" />
        </Box>
      )}
      <Paper>
        <GroupsList
          groups={groups}
          isLoading={isLoading}
          error={error}
          emptyMessage="You haven't created any groups yet."
          emptyActionText="Create Your First Group"
          emptyActionLink="/groups/new"
        />
      </Paper>
    </Box>
  )
}

export default GroupsPage
