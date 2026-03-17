import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import CustomSelect from '../../components/CustomSelect'
import TicketCard from '../../components/TicketCard'
import { getAssignedTickets, updateStatus } from '../../api/tickets'
import { getNotifications, markAllRead, markRead } from '../../api/notifications'

const transitionOptions = {
  open: [],
  assigned: ['in_progress'],
  in_progress: ['done'],
  done: [],
}

function formatLabel(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function TechnicianDashboard() {
  const [tickets, setTickets] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [searchParams] = useSearchParams()

  const unreadCount = notifications.filter((item) => item.is_read === 0).length
  const activeTicketId = Number(searchParams.get('ticket') || 0)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [ticketData, notificationData] = await Promise.all([
        getAssignedTickets(),
        getNotifications(),
      ])
      setTickets(ticketData)
      setNotifications(notificationData)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load technician dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    if (!activeTicketId || loading) return
    const element = document.getElementById(`ticket-card-${activeTicketId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeTicketId, loading, tickets])

  const handleStatusUpdate = async (ticketId, status) => {
    setActionLoading(`status-${ticketId}`)
    try {
      await updateStatus(ticketId, status)
      toast.success('Status updated')
      await loadDashboard()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to update status')
    } finally {
      setActionLoading('')
    }
  }

  const handleMarkRead = async (id, options = {}) => {
    setNotificationLoading(true)
    try {
      await markRead(id)
      await loadDashboard()
      if (!options.silent) {
        toast.success('Notification marked as read')
      }
    } catch (error) {
      if (!options.silent) {
        toast.error(error.response?.data?.detail || 'Unable to mark notification')
      }
    } finally {
      setNotificationLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    setNotificationLoading(true)
    try {
      await markAllRead()
      await loadDashboard()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to mark all notifications')
    } finally {
      setNotificationLoading(false)
    }
  }

  const stats = [
    { label: 'Assigned tasks', value: tickets.length, icon: 'A' },
    { label: 'In progress', value: tickets.filter((ticket) => ticket.status === 'in_progress').length, icon: 'P' },
    { label: 'Completed', value: tickets.filter((ticket) => ticket.status === 'done').length, icon: 'D' },
    { label: 'Unread alerts', value: unreadCount, icon: 'N' },
  ]

  return (
    <AppShell
      stats={stats}
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      notificationLoading={notificationLoading}
    >
      <div className="content-grid">
        <div className="tickets-column">
          <section className="panel-card card">
            <div className="split-header">
              <div>
                <h2>Assigned tasks</h2>
                <p className="muted">Only the tickets assigned to you appear here.</p>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading tasks...</div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">No tasks assigned right now.</div>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    hideTechnician
                    highlighted={ticket.id === activeTicketId}
                    controls={ticket.status === 'done' ? null : (
                      <div className="field compact-action">
                        <CustomSelect
                          id={`status-${ticket.id}`}
                          label="Move ticket forward"
                          value=""
                          onChange={(value) => {
                            if (!value) return
                            handleStatusUpdate(ticket.id, value)
                          }}
                          placeholder="Choose next step"
                          disabled={transitionOptions[ticket.status].length === 0}
                          options={transitionOptions[ticket.status].map((status) => ({
                            value: status,
                            label: formatLabel(status),
                            description: `Update task to ${formatLabel(status)}.`,
                          }))}
                        />
                      </div>
                    )}
                    footer={
                      ticket.status === 'done'
                        ? <span className="muted">This task is complete.</span>
                        : actionLoading === `status-${ticket.id}`
                          ? <span className="muted">Saving update...</span>
                          : null
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
