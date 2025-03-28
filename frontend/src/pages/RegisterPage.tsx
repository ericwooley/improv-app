import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'

const RegisterPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      // TODO: Replace with actual API call when backend is updated
      console.log('Registering user with email:', email)
      setSuccess('Registration successful! Please check your email for verification link.')
    } catch {
      setError('Failed to register. Please try again.')
    }
  }

  return (
    <div className="columns is-centered">
      <div className="column is-6">
        <div className="box has-background-white p-6 mt-5">
          <div className="has-text-centered mb-5">
            <span className="icon is-large has-text-primary">
              <i className="fas fa-user-plus fa-3x"></i>
            </span>
            <h1 className="title is-2 mt-3">Register</h1>
          </div>

          <div className="notification is-light">
            <h2 className="title">Join Improv App</h2>
            <p className="subtitle">Enter your email address to create an account.</p>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <div className="control has-icons-left">
                  <input
                    type="email"
                    id="email"
                    required
                    className="input is-medium"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <span className="icon is-small is-left">
                    <i className="fas fa-envelope"></i>
                  </span>
                </div>
              </div>
              <div className="field mt-5">
                <div className="control">
                  <button type="submit" className="button is-primary is-fullwidth is-medium">
                    <span className="icon">
                      <i className="fas fa-user-plus"></i>
                    </span>
                    <span>Create Account</span>
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="notification is-danger mt-4">
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="notification is-success mt-4">
                <p>{success}</p>
              </div>
            )}
          </div>

          <div className="has-text-centered mt-5">
            <p className="is-size-6">
              Already have an account?{' '}
              <Link to="/login" className="has-text-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
