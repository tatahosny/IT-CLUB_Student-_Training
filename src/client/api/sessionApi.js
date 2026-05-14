import api from '../services/api'

export const sessionApi = {
  getAll: (params) => api.get('/sessions', { params }),
  getById: (id) => api.get(`/sessions/${id}`),
  create: (data) => api.post('/sessions', data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  delete: (id) => api.delete(`/sessions/${id}`),
  openWindow: (id, data) => api.post(`/sessions/${id}/attendance/open`, data),
  closeWindow: (id, data) => api.post(`/sessions/${id}/attendance/close`, data),
  generateQR: (id) => api.post(`/sessions/${id}/qr`),
}
