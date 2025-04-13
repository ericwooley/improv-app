import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateGroupMutation } from '../store/api/groupsApi'
import { PageHeader } from '../components'
import { GroupForm, GroupFormData } from '../components/GroupForm'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const NewGroupPage = () => {
  const navigate = useNavigate()
  const [createGroup, { isLoading, error }] = useCreateGroupMutation()
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
  })

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createGroup(formData).unwrap()
      navigate('/groups')
    } catch (err) {
      // Error is handled by the mutation hook
      console.error('Failed to create group:', err)
    }
  }

  const errorMessage = error ? ((error as FetchBaseQueryError).data as string) : null

  return (
    <div className="content-wrapper">
      <PageHeader title="Create New Group" subtitle="Set up a new improv group" />

      <GroupForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateGroup}
        onCancel={() => navigate('/groups')}
        isLoading={isLoading}
        error={errorMessage ? new Error(errorMessage) : null}
        submitButtonText="Create Group"
        submitButtonIcon="fas fa-plus"
        cancelButtonText="Cancel"
        cancelButtonTo="/groups"
      />
    </div>
  )
}

export default NewGroupPage
