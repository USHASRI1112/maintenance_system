import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function formatRole(role) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function AppShell({
  stats,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  notificationLoading = false,
  children,
}) {
  const { user, logoutUser } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const openNotification = async (notification) => {
    if (notification.is_read === 0 && onMarkRead) {
      await onMarkRead(notification.id, { silent: true })
    }
    navigate(`${location.pathname}?ticket=${notification.ticket_id}`)
    setShowNotifications(false)
  }

  return (
    <div className="page-shell">
      <div className="dashboard-shell">
        <div className="topbar card">
          <div className="brand-block">
            <strong>MaintainFlow</strong>
          </div>
          <div className="topbar-actions">
            <span className="role-chip">{formatRole(user.role)}</span>
            <span className="muted">{user.full_name}</span>
            <button
              className="button button-ghost bell-button"
              onClick={() => setShowNotifications((current) => !current)}
              type="button"
            >
              <svg className="bell-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 3a4 4 0 0 0-4 4v1.1c0 .7-.2 1.4-.6 2L6.2 12a3.5 3.5 0 0 0-.6 2v1h12.8v-1a3.5 3.5 0 0 0-.6-2l-1.2-1.9c-.4-.6-.6-1.3-.6-2V7a4 4 0 0 0-4-4Zm0 18a2.7 2.7 0 0 0 2.5-1.7h-5A2.7 2.7 0 0 0 12 21Z"
                  fill="currentColor"
                />
              </svg>
              {unreadCount > 0 ? <span className="bell-count">{unreadCount}</span> : null}
            </button>
            <button className="button button-ghost" onClick={logoutUser}>Log out</button>
          </div>
        </div>

        {showNotifications ? (
          <div className="modal-overlay" onClick={() => setShowNotifications(false)}>
            <div className="notification-modal card" onClick={(event) => event.stopPropagation()}>
              <div className="notification-header">
                <div>
                  <h2>Notifications</h2>
                </div>
                <div className="button-row">
                  <button
                    className="button button-secondary"
                    onClick={onMarkAllRead}
                    disabled={!onMarkAllRead || notificationLoading || unreadCount === 0}
                    type="button"
                  >
                    Mark all read
                  </button>
                  <button
                    className="button button-ghost"
                    onClick={() => setShowNotifications(false)}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">No notifications yet.</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      className={`notification-item notification-link ${notification.is_read ? '' : 'unread'}`}
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      type="button"
                    >
                      <div>
                        <strong>{notification.message}</strong>
                        <time>{formatDateTime(notification.created_at)}</time>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        <div className="stats-bar card">
          {stats.map((stat) => (
            <div className="stat-pill" key={stat.label}>
              <span className="stat-pill-icon" aria-hidden="true">{stat.icon || '•'}</span>
              <span className="stat-pill-label">{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        {children}
      </div>
    </div>
  )
}
