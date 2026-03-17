import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="center-shell">
        <div className="card center-card">
          <h2 style={{ marginTop: 0 }}>Loading workspace...</h2>
          <p className="muted">Checking your session and role permissions.</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
