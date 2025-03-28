import { ActionButton, InfoItem, formatDate, ItemCard } from './index'
import { Group } from '../store/api/groupsApi'

interface GroupCardProps {
  group: Group
  variant?: 'default' | 'compact'
  className?: string
}

export const GroupCard = ({ group, variant = 'default', className = '' }: GroupCardProps) => {
  if (variant === 'compact') {
    return (
      <div className={`box has-background-white-ter mb-3 ${className}`}>
        <div className="is-flex is-flex-direction-column-mobile is-justify-content-space-between is-align-items-center">
          <div className="mb-3-mobile">
            <h3 className="title">{group.Name}</h3>
            <p className="subtitle  has-text-grey">{group.Description}</p>
          </div>
          <ActionButton text="" to={`/groups/${group.ID}`} icon="fas fa-chevron-right" variant="link" outlined />
        </div>
      </div>
    )
  }

  return (
    <div className={`column is-12 ${className}`}>
      <ItemCard id={group.ID} title={group.Name} description={group.Description} footerLink={`/groups/${group.ID}`}>
        <InfoItem icon="fas fa-calendar-alt">
          <span className="is-size-7">Created {formatDate(new Date(group.CreatedAt))}</span>
        </InfoItem>
      </ItemCard>
    </div>
  )
}
