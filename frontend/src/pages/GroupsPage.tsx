import { useState } from 'react'
import { PageHeader, CardGrid, ItemCard, EmptyState, ActionButton, InfoItem, formatDate } from '../components'

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

  return (
    <div className="content-wrapper">
      <PageHeader title="Improv Groups" subtitle="Manage and explore your improv groups" />

      {groups.length > 0 && (
        <div className="mb-5">
          <ActionButton text="Create Group" to="/groups/new" icon="fas fa-plus" />
        </div>
      )}

      {groups.length > 0 ? (
        <CardGrid>
          {groups.map((group) => (
            <div key={group.id} className="column is-4">
              <ItemCard
                id={group.id}
                title={group.name}
                description={group.description}
                footerLink={`/groups/${group.id}`}>
                <InfoItem icon="fas fa-calendar-alt">
                  <span className="is-size-7">Created {formatDate(group.createdAt)}</span>
                </InfoItem>
              </ItemCard>
            </div>
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
