import { useState, FormEvent } from 'react'

interface User {
  firstName: string
  lastName: string
}

interface ProfilePageProps {
  user?: User
}

const ProfilePage = ({ user }: ProfilePageProps) => {
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
  }>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setErrors({})

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
      setErrors(newErrors)
      return
    }

    try {
      // TODO: Replace with actual API call when backend is updated
      console.log('Updating profile:', { firstName, lastName })
      setSuccess('Profile updated successfully!')
    } catch {
      setError('Failed to update profile. Please try again.')
    }
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
              {success && (
                <div className="notification is-success mb-4">
                  <button className="delete" onClick={() => setSuccess(null)}></button>
                  <p>
                    <strong>Success!</strong> {success}
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
                        className={`input is-medium ${errors.firstName ? 'is-danger' : ''}`}
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-user"></i>
                      </span>
                    </div>
                    {errors.firstName && <p className="help is-danger">{errors.firstName}</p>}
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
                        className={`input is-medium ${errors.lastName ? 'is-danger' : ''}`}
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                      <span className="icon is-small is-left">
                        <i className="fas fa-user"></i>
                      </span>
                    </div>
                    {errors.lastName && <p className="help is-danger">{errors.lastName}</p>}
                  </div>
                </div>
              </div>

              <div className="field mt-5">
                <div className="control">
                  <button type="submit" className="button is-primary is-medium is-fullwidth">
                    <span className="icon">
                      <i className="fas fa-save"></i>
                    </span>
                    <span>Update Profile</span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="notification is-danger mt-4">
                  <p>{error}</p>
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
