import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetGroupQuery, useUpdateGroupMutation } from '../store/api/groupsApi'
import { PageHeader } from '../components'
import { GroupForm, GroupFormData } from '../components/GroupForm'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const EditGroupPage = () => {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { data: groupResponse, isLoading: isLoadingGroup } = useGetGroupQuery(groupId || '')
  const [updateGroup, { isLoading: isUpdating, error }] = useUpdateGroupMutation()
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (groupResponse?.data) {
      const { group } = groupResponse.data
      setFormData({
        name: group.Name,
        description: group.Description,
      })
    }
  }, [groupResponse])

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateGroup({
        id: groupId || '',
        ...formData,
      }).unwrap()
      navigate(`/groups/${groupId}`)
    } catch (err) {
      console.error('Failed to update group:', err)
    }
  }

  if (isLoadingGroup) {
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

  if (!groupResponse?.data) {
    return (
      <div className="content-wrapper">
        <div className="notification is-danger">
          <p>Error loading group details. Please try again later.</p>
        </div>
      </div>
    )
  }

  const { group } = groupResponse.data
  const errorMessage = error ? ((error as FetchBaseQueryError).data as string) : null

  return (
    <div className="content-wrapper">


      <PageHeader title="Edit Group" subtitle="Update your group's information" />

      <GroupForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleUpdateGroup}
        onCancel={() => navigate(`/groups/${group.ID}`)}
        isLoading={isUpdating}
        error={errorMessage ? new Error(errorMessage) : null}
        submitButtonText="Save Changes"
        submitButtonIcon="fas fa-check"
        cancelButtonText="Cancel"
        cancelButtonTo={`/groups/${group.ID}`}
      />
    </div>
  )
}

export default EditGroupPage
