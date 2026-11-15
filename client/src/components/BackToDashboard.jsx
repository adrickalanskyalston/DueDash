import { Link } from 'react-router-dom'

// Site-map rule: every child screen gets a visible "Back to Dashboard" link.
export default function BackToDashboard() {
  return (
    <p className="back-link">
      <Link to="/">← Back to Dashboard</Link>
    </p>
  )
}
