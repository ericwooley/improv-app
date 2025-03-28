import { useState, FormEvent, useEffect } from 'react'
import { useGetMeQuery, useUpdateProfileMutation } from '../store/api/authApi'

const ProfilePage = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [formErrors, setFormErrors] = useState<{
    firstName?: string
    lastName?: string
  }>({})

  // Get the user data using RTK Query
  const { data: userResponse, isLoading: isLoadingUser } = useGetMeQuery()
  const { data: user } = userResponse || {}
  // Update profile mutation
  const [updateProfile, { isLoading: isUpdating, error: updateError, isSuccess }] = useUpdateProfileMutation()
  const { firstName: firstNameFromUser, lastName: lastNameFromUser } = user || {}
  console.log(user)
  // Set form values when user data is loaded
  useEffect(() => {
    setFirstName(firstNameFromUser || '')
    setLastName(lastNameFromUser || '')
  }, [firstNameFromUser, lastNameFromUser])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    // Basic validation
    const newErrors: {
      firstName?: string
      lastName?: string
    } = {}

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors)
      return
    }

    try {
      await updateProfile({ firstName, lastName }).unwrap()
    } catch (err) {
      console.error('Failed to update profile:', err)
    }
  }

  if (isLoadingUser) {
    return (
      <div className="has-text-centered p-6">
        <p className="is-size-4">Loading profile...</p>
        <progress className="progress is-primary mt-4" max="100" />
      </div>
    )
  }

  return (
    <div className="columns is-centered">
      <div className="column is-8">
        <div className="box has-background-white p-6 mt-4">
          <div className="has-text-centered mb-5">
            <span className="icon is-large has-text-primary">
              <i className="fas fa-user-circle fa-3x"></i>
            </span>
            <h1 className="title is-2 mt-3">Complete Your Profile</h1>
          </div>

          <div className="notification is-light p-5">
            <h2 className="title">Tell Us About Yourself</h2>
            <p className="subtitle">Please provide your name to complete your profile.</p>

            <form onSubmit={handleSubmit}>
              {isSuccess && (
                <div className="notification is-success mb-4">
                  <button className="delete" onClick={() => null}></button>
                  <p>
                    <strong>Success!</strong> Profile updated successfully!
                  </p>
                </div>
              )}

              <div className="columns">
                <div className="column is-6">
                  <div className="field">
                    <label htmlFor="first_name" className="label">
                      First Name
                    </label>
                    <div className="control has-icons-left">
                      <input
                        type="text"
                        id="first_name"
                        className={`input is-medium ${formErrors.firstName ? 'is-danger' : ''}`}
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isUpdating}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-user"></i>
                      </span>
                    </div>
                    {formErrors.firstName && <p className="help is-danger">{formErrors.firstName}</p>}
                  </div>
                </div>
                <div className="column is-6">
                  <div className="field">
                    <label htmlFor="last_name" className="label">
                      Last Name
                    </label>
                    <div className="control has-icons-left">
                      <input
                        type="text"
                        id="last_name"
                        className={`input is-medium ${formErrors.lastName ? 'is-danger' : ''}`}
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isUpdating}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-user"></i>
                      </span>
                    </div>
                    {formErrors.lastName && <p className="help is-danger">{formErrors.lastName}</p>}
                  </div>
                </div>
              </div>

              <div className="field mt-5">
                <div className="control">
                  <button
                    type="submit"
                    className={`button is-primary is-medium is-fullwidth ${isUpdating ? 'is-loading' : ''}`}
                    disabled={isUpdating}>
                    <span className="icon">
                      <i className="fas fa-save"></i>
                    </span>
                    <span>Update Profile</span>
                  </button>
                </div>
              </div>

              {updateError && (
                <div className="notification is-danger mt-4">
                  <p>{JSON.stringify(updateError)}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
