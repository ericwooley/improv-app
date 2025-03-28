import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="content-wrapper">
      <div className="has-text-centered">
        <h1 className="title is-1">404</h1>
        <p className="subtitle is-3 mb-6">Page Not Found</p>

        <div className="is-flex is-justify-content-center mb-6">
          <span className="icon is-large has-text-danger">
            <i className="fas fa-exclamation-triangle fa-3x"></i>
          </span>
        </div>

        <p className="is-size-5 mb-5">The page you were looking for doesn't exist or has been moved.</p>

        <Link to="/" className="button is-primary is-medium">
          <span className="icon">
            <i className="fas fa-home"></i>
          </span>
          <span>Return to Home</span>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
