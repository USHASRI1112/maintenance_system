function formatDateTime(value) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  loading,
}) {
  return (
    <aside className="notification-panel">
      <div className="notification-header">
        <div>
          <h2>Notifications</h2>
          <p className="muted">{unreadCount} unread</p>
        </div>
        <button
          className="button button-secondary"
          onClick={onMarkAllRead}
          disabled={loading || unreadCount === 0}
        >
          Mark all read
        </button>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`notification-item ${notification.is_read ? '' : 'unread'}`}
              key={notification.id}
            >
              <div>
                <strong>{notification.message}</strong>
                <time>{formatDateTime(notification.created_at)}</time>
              </div>
              {!notification.is_read ? (
                <button
                  className="button button-ghost"
                  onClick={() => onMarkRead(notification.id)}
                  disabled={loading}
                >
                  Mark read
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
