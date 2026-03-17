import api from './axios'

export const createTicket = (data) => api.post('/tickets/', data).then(r => r.data)
export const getMyTickets = () => api.get('/tickets/my').then(r => r.data)
export const getAllTickets = (params) => api.get('/tickets/', { params }).then(r => r.data)
export const getAssignedTickets = () => api.get('/tickets/assigned').then(r => r.data)
export const getTicket = (id) => api.get(`/tickets/${id}`).then(r => r.data)
export const assignTicket = (id, technician_id) => api.patch(`/tickets/${id}/assign`, { technician_id }).then(r => r.data)
export const updateStatus = (id, status) => api.patch(`/tickets/${id}/status`, { status }).then(r => r.data)
export const updatePriority = (id, priority) => api.patch(`/tickets/${id}/priority`, { priority }).then(r => r.data)
export const uploadImages = (id, files) => {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  return api.post(`/tickets/${id}/upload`, form).then(r => r.data)
}
export const getTechnicians = () => api.get('/users/technicians').then(r => r.data)