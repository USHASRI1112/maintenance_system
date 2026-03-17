import { useState } from 'react'

function formatDateTime(value) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function titleize(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function TicketCard({
  ticket,
  controls,
  footer,
  hideTenant = false,
  hideTechnician = false,
  highlighted = false,
}) {
  const [showActivity, setShowActivity] = useState(false)
  const [showImages, setShowImages] = useState(false)
  const activityCount = ticket.activity_logs?.length || 0
  const imageCount = ticket.image_urls?.length || 0

  return (
    <article className={`ticket-card ${highlighted ? 'ticket-card-highlighted' : ''}`} id={`ticket-card-${ticket.id}`}>
      <div className="ticket-card-header">
        <div className="ticket-header-top">
          <div className="ticket-header-meta">
            <span>Created {formatDateTime(ticket.created_at)}</span>
            <span>Updated {formatDateTime(ticket.updated_at || ticket.created_at)}</span>
          </div>
          <div className="ticket-badges">
            <span className={`status-badge status-${ticket.status}`}>{titleize(ticket.status)}</span>
            <span className={`priority-badge priority-${ticket.priority}`}>{titleize(ticket.priority)}</span>
          </div>
        </div>
        <div className="ticket-header-main">
          <h3>{ticket.title}</h3>
          <p className="muted">{ticket.description}</p>
        </div>
      </div>

      <div className="meta-grid">
        {!hideTenant ? (
          <div className="meta-item">
            <span>Tenant</span>
            <strong>{ticket.tenant?.full_name || 'Unknown'}</strong>
          </div>
        ) : null}
        {!hideTechnician ? (
          <div className="meta-item">
            <span>Technician</span>
            <strong>{ticket.technician?.full_name || 'Unassigned'}</strong>
          </div>
        ) : null}
      </div>

      {controls ? (
        <div className="ticket-subsection">
          {controls}
        </div>
      ) : null}

      {imageCount ? (
        <div className="ticket-subsection ticket-images">
          <div className="split-header">
            <h4 style={{ margin: 0 }}>Images</h4>
            <div className="split-actions">
              <span className="muted">{imageCount} uploaded</span>
              <button
                type="button"
                className="button button-ghost button-small"
                onClick={() => setShowImages((current) => !current)}
              >
                {showImages ? 'Hide' : 'Expand'}
              </button>
            </div>
          </div>
          {showImages ? (
            <div className="ticket-images-grid">
              {ticket.image_urls.map((path) => (
                <div className="ticket-image" key={path}>
                  <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}${path}`} alt={ticket.title} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activityCount ? (
        <div className="ticket-subsection">
          <div className="split-header">
            <h4 style={{ margin: 0 }}>Activity log</h4>
            <div className="split-actions">
              <span className="muted">{activityCount} events</span>
              <button
                type="button"
                className="button button-ghost button-small"
                onClick={() => setShowActivity((current) => !current)}
              >
                {showActivity ? 'Hide' : 'Expand'}
              </button>
            </div>
          </div>
          {showActivity ? (
            <div className="activity-list">
              {ticket.activity_logs.map((item) => (
                <div className="activity-item" key={item.id}>
                  <div>
                    <strong>{item.detail || titleize(item.action)}</strong>
                    <span className="muted">{item.user?.full_name || 'System'}</span>
                  </div>
                  <time>{formatDateTime(item.created_at)}</time>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {footer ? <div className="ticket-card-footer">{footer}</div> : null}
    </article>
  )
}
