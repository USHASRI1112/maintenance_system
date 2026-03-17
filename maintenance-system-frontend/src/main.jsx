/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ManagerDashboard from './pages/manager/ManagerDashboard'
import TechnicianDashboard from './pages/technician/TechnicianDashboard'
import TenantDashboard from './pages/tenant/TenantDashboard'
import './index.css'

function RoleRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="center-shell">
        <div className="card center-card">
          <h2 style={{ marginTop: 0 }}>Opening workspace...</h2>
          <p className="muted">Loading your maintenance dashboard.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const routeMap = {
    tenant: '/tenant',
    manager: '/manager',
    technician: '/technician',
  }

  return <Navigate to={routeMap[user.role] || '/login'} replace />
}

function UnauthorizedPage() {
  return (
    <div className="center-shell">
      <div className="card center-card">
        <h2 style={{ marginTop: 0 }}>Access denied</h2>
        <p className="muted">Your account does not have permission to view this screen.</p>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/tenant"
            element={(
              <ProtectedRoute roles={['tenant']}>
                <TenantDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/manager"
            element={(
              <ProtectedRoute roles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/technician"
            element={(
              <ProtectedRoute roles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            )}
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
