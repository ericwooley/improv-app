import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useLoginMutation } from '../store/api/authApi'
import { useAppDispatch } from '../store/hooks'
import { setCredentials } from '../store/slices/authSlice'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const dispatch = useAppDispatch()

  // RTK Query hook for login mutation
  const [login, { isLoading, error }] = useLoginMutation()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    try {
      const response = await login({ email }).unwrap()
      // Update Redux state with the user info
      dispatch(setCredentials(response.user))

      // Show success message - in a real app you might want to redirect
      // or handle this differently depending on your authentication flow
      alert('Magic link has been sent to your email. Please check your inbox.')
    } catch (err) {
      // Error is handled by RTK Query and available in the error variable
      console.error('Failed to send magic link:', err)
    }
  }

  return (
    <div className="columns is-centered">
      <div className="column is-6">
        <div className="box has-background-white p-6 mt-5">
          <div className="has-text-centered mb-5">
            <span className="icon is-large has-text-primary">
              <i className="fas fa-key fa-3x"></i>
            </span>
            <h1 className="title is-2 mt-3">Sign In</h1>
          </div>

          <div className="notification is-light">
            <h2 className="title">Enter Your Email</h2>
            <p className="subtitle">Enter your email address and we'll send you a magic link to sign in.</p>

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
                    disabled={isLoading}
                  />
                  <span className="icon is-small is-left">
                    <i className="fas fa-envelope"></i>
                  </span>
                </div>
              </div>
              <div className="field mt-5">
                <div className="control">
                  <button
                    type="submit"
                    className={`button is-primary is-fullwidth is-medium ${isLoading ? 'is-loading' : ''}`}
                    disabled={isLoading}>
                    <span className="icon">
                      <i className="fas fa-paper-plane"></i>
                    </span>
                    <span>Send Magic Link</span>
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="notification is-danger mt-4">
                <p>{JSON.stringify(error)}</p>
              </div>
            )}
          </div>

          <div className="has-text-centered mt-5">
            <p className="is-size-6">
              Don't have an account?{' '}
              <Link to="/register" className="has-text-primary">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
