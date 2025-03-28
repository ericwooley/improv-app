import { useState, useEffect } from 'react'
import { useGetMeQuery, useUpdateProfileMutation } from '../store/api/authApi'
import { PageHeader, FormContainer, InputField, FormActions, ActionButton } from '../components'

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
  })

  // Get the user data using RTK Query
  const { data: userResponse, isLoading: isLoadingUser } = useGetMeQuery()
  const { data: user } = userResponse || {}
  // Update profile mutation
  const [updateProfile, { isLoading: isUpdating, error: updateError, isSuccess }] = useUpdateProfileMutation()

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
      }).unwrap()
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  if (isLoadingUser) {
    return (
      <div className="content-wrapper has-text-centered">
        <p className="is-size-4">Loading profile...</p>
        <progress className="progress is-primary mt-4" max="100" />
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      <PageHeader title="My Profile" subtitle="Manage your personal information" />

      {isSuccess && (
        <div className="notification is-success mb-4">
          <button className="delete" onClick={() => null}></button>
          <p>
            <strong>Success!</strong> Profile updated successfully!
          </p>
        </div>
      )}

      {updateError && (
        <div className="notification is-danger mb-4">
          <p>{JSON.stringify(updateError)}</p>
        </div>
      )}

      <FormContainer onSubmit={handleSubmit}>
        <InputField
          id="firstName"
          label="First Name"
          value={profile.firstName}
          placeholder="Enter your first name"
          required
          icon="fas fa-user"
          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
        />

        <InputField
          id="lastName"
          label="Last Name"
          value={profile.lastName}
          placeholder="Enter your last name"
          required
          icon="fas fa-user"
          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
        />

        <FormActions>
          <ActionButton text="Cancel" to="/dashboard" variant="light" />
          <ActionButton
            text="Update Profile"
            icon="fas fa-save"
            type="submit"
            className={isUpdating ? 'is-loading' : ''}
          />
        </FormActions>
      </FormContainer>
    </div>
  )
}

export default ProfilePage
