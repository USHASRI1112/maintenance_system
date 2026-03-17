import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import CustomSelect from '../../components/CustomSelect'
import TicketCard from '../../components/TicketCard'
import {
  assignTicket,
  getAllTickets,
  getTechnicians,
  updatePriority,
  updateStatus,
} from '../../api/tickets'
import { getNotifications, markAllRead, markRead } from '../../api/notifications'

const filterDefaults = {
  status: '',
  priority: '',
}

const transitionOptions = {
  open: ['assigned'],
  assigned: ['in_progress'],
  in_progress: ['done'],
  done: [],
}

function formatLabel(value) {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function ManagerDashboard() {
  const [tickets, setTickets] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [notifications, setNotifications] = useState([])
  const [filters, setFilters] = useState(filterDefaults)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [assignments, setAssignments] = useState({})
  const [searchParams] = useSearchParams()

  const unreadCount = notifications.filter((item) => item.is_read === 0).length
  const activeTicketId = Number(searchParams.get('ticket') || 0)

  const loadDashboard = async (activeFilters = filters) => {
    setLoading(true)
    try {
      const [ticketData, technicianData, notificationData] = await Promise.all([
        getAllTickets({
          status: activeFilters.status || undefined,
          priority: activeFilters.priority || undefined,
        }),
        getTechnicians(),
        getNotifications(),
      ])
      setTickets(ticketData)
      setTechnicians(technicianData)
      setNotifications(notificationData)
      setAssignments((current) => {
        const next = { ...current }
        ticketData.forEach((ticket) => {
          next[ticket.id] = next[ticket.id] || ticket.technician_id || ''
        })
        return next
      })
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to load manager dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard(filterDefaults)
    // The initial load intentionally runs once with default filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!activeTicketId || loading) return
    const element = document.getElementById(`ticket-card-${activeTicketId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeTicketId, loading, tickets])

  const handleFilterChange = async (event) => {
    const next = { ...filters, [event.target.name]: event.target.value }
    setFilters(next)
    await loadDashboard(next)
  }

  const wrapAction = async (key, callback, successMessage) => {
    setActionLoading(key)
    try {
      await callback()
      toast.success(successMessage)
      await loadDashboard()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Action failed')
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
    { label: 'All tickets', value: tickets.length, icon: 'T' },
    { label: 'Open or assigned', value: tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'assigned').length, icon: 'Q' },
    { label: 'Urgent', value: tickets.filter((ticket) => ticket.priority === 'urgent').length, icon: '!' },
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
                <h2>Tickets</h2>
              </div>
            </div>

              <div className="filters-grid">
                <CustomSelect
                  id="status-filter"
                  label="Status"
                  value={filters.status}
                  onChange={(value) => handleFilterChange({ target: { name: 'status', value } })}
                  placeholder="All statuses"
                  options={[
                    { value: '', label: 'All statuses' },
                    { value: 'open', label: 'Open' },
                    { value: 'assigned', label: 'Assigned' },
                    { value: 'in_progress', label: 'In progress' },
                    { value: 'done', label: 'Done' },
                  ]}
                />

                <CustomSelect
                  id="priority-filter"
                  label="Priority"
                  value={filters.priority}
                  onChange={(value) => handleFilterChange({ target: { name: 'priority', value } })}
                  placeholder="All priorities"
                  options={[
                    { value: '', label: 'All priorities' },
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                />
            </div>
          </section>

          <section className="panel-card card">
            {loading ? (
              <div className="empty-state">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="empty-state">No tickets match the current filters.</div>
            ) : (
              <div className="ticket-list">
                {tickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    highlighted={ticket.id === activeTicketId}
                    controls={(
                      <div className="manager-controls">
                        <div className="control-grid">
                          <div className="field">
                            <CustomSelect
                              id={`technician-${ticket.id}`}
                              label="Technician"
                              value={assignments[ticket.id] || ''}
                              onChange={(value) => setAssignments((current) => ({ ...current, [ticket.id]: Number(value) || '' }))}
                              placeholder={ticket.technician ? ticket.technician.full_name : 'Choose technician'}
                              options={technicians.map((technician) => ({
                                value: technician.id,
                                label: technician.full_name,
                              }))}
                            />
                            <button
                              className="button button-secondary"
                              onClick={() => wrapAction(
                                `assign-${ticket.id}`,
                                () => assignTicket(ticket.id, assignments[ticket.id]),
                                ticket.technician_id ? 'Technician reassigned' : 'Technician assigned',
                              )}
                              disabled={
                                actionLoading === `assign-${ticket.id}` ||
                                !assignments[ticket.id] ||
                                Number(assignments[ticket.id]) === ticket.technician_id
                              }
                              type="button"
                            >
                              {ticket.technician_id ? 'Reassign' : 'Assign'}
                            </button>
                          </div>

                          <CustomSelect
                            id={`priority-${ticket.id}`}
                            label="Priority"
                            value={ticket.priority}
                            onChange={(value) => wrapAction(
                              `priority-${ticket.id}`,
                              () => updatePriority(ticket.id, value),
                              'Priority updated',
                            )}
                            options={[
                              { value: 'low', label: 'Low' },
                              { value: 'medium', label: 'Medium' },
                              { value: 'high', label: 'High' },
                              { value: 'urgent', label: 'Urgent' },
                            ]}
                          />
                        </div>

                        <div className="field compact-action">
                          <CustomSelect
                          id={`status-${ticket.id}`}
                          label="Next status"
                          value=""
                          onChange={(value) => {
                            if (!value) return
                            wrapAction(
                              `status-${ticket.id}`,
                              () => updateStatus(ticket.id, value),
                              'Status updated',
                            )
                          }}
                          placeholder="Select transition"
                          disabled={transitionOptions[ticket.status].length === 0}
                          options={transitionOptions[ticket.status].map((status) => ({
                            value: status,
                            label: formatLabel(status),
                          }))}
                        />
                        </div>
                      </div>
                    )}
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
