import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import CustomSelect from '../../components/CustomSelect'
import TicketCard from '../../components/TicketCard'
import { createTicket, getMyTickets, uploadImages } from '../../api/tickets'
import { getNotifications, markAllRead, markRead } from '../../api/notifications'

const initialForm = {
  title: '',
  description: '',
  priority: 'medium',
}

export default function TenantDashboard() {
  const [tickets, setTickets] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [files, setFiles] = useState([])
  const [searchParams] = useSearchParams()

  const unreadCount = notifications.filter((item) => item.is_read === 0).length
  const activeTicketId = Number(searchParams.get('ticket') || 0)

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [ticketData, notificationData] = await Promise.all([
        getMyTickets(),
        getNotifications(),
      ])
      setTickets(ticketData)
      setNotifications(notificationData)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load tenant dashboard')
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

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const ticket = await createTicket(form)
      if (files.length) {
        await uploadImages(ticket.id, files)
      }
      setForm(initialForm)
      setFiles([])
      toast.success('Maintenance request submitted')
      await loadDashboard()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to submit ticket')
    } finally {
      setSubmitting(false)
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
    { label: 'My tickets', value: tickets.length, icon: 'T' },
    { label: 'Open items', value: tickets.filter((ticket) => ticket.status !== 'done').length, icon: 'O' },
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
                <h2>Create request</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Leaking sink in unit 5B"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the issue"
                  required
                />
              </div>

              <div className="filters-grid">
                <CustomSelect
                  id="priority"
                  label="Priority"
                  value={form.priority}
                  onChange={(value) => setForm((current) => ({ ...current, priority: value }))}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                />

                <div className="field">
                  <label htmlFor="images">Images</label>
                  <input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 5))}
                  />
                </div>
              </div>

              {files.length ? (
                <div className="file-list" style={{ marginBottom: 16 }}>
                  {files.map((file) => (
                    <span className="file-chip" key={`${file.name}-${file.size}`}>{file.name}</span>
                  ))}
                </div>
              ) : null}

              <div className="button-row">
                <button className="button button-primary" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </form>
          </section>

          <section className="panel-card card">
            <div className="split-header">
              <div>
                <h2>My tickets</h2>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">No maintenance requests yet.</div>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    hideTenant
                    highlighted={ticket.id === activeTicketId}
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
