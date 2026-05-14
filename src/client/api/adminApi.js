import api from '../services/api'

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/update-profile', data),
}

export const adminApi = {
  getAnalytics: () => api.get('/admin/analytics'),
  getDetailedAnalytics: (params) => api.get('/admin/detailed-analytics', { params }),
  getSecurityLogs: (params) => api.get('/admin/security-logs', { params }),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  blockUser: (id, data) => api.post(`/admin/users/${id}/block`, data),
  getHistory: (id) => api.get(`/admin/users/${id}/history`),
  downloadTemplate: () => api.get('/admin/users/template', { responseType: 'blob' }),
  importStudents: (formData) => api.post('/admin/users/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getGroups: () => api.get('/admin/groups'),
  createGroup: (data) => api.post('/admin/groups', data),
  getNotifications: () => api.get('/admin/notifications'),
  markRead: (id) => api.put(`/admin/notifications/${id}/read`),
  getLevels: () => api.get('/admin/levels'),
  getRoles: () => api.get('/admin/roles'),
  getGlobalAttendance: (params) => api.get('/admin/attendance', { params }),
  logActivity: (data) => api.post('/admin/log', data),
}

export const attendanceApi = {
  scanQR: (data) => api.post('/attendance/scan', data),
  getMyQR: (sessionId) => api.get(`/attendance/my-qr/${sessionId}`),
  getSessionAttendance: (sessionId) => api.get(`/attendance/session/${sessionId}`),
  getHistory: () => api.get('/attendance/history'),
  getStudentHistory: (studentId) => api.get(`/attendance/history/${studentId}`),
  markManual: (data) => api.post('/attendance/manual', data),
  getWorkshopQR: (sessionId, duration) => api.get(`/attendance/workshop-qr/${sessionId}${duration ? `?duration=${duration}` : ''}`),
}

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

export const taskApi = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  submit: (taskId, formData) => api.post(`/tasks/${taskId}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSubmissions: (taskId) => api.get(`/tasks/${taskId}/submissions`),
  getMySubmissions: () => api.get('/tasks/my/submissions'),
  deleteFile: (taskId, fileName) => api.delete(`/tasks/${taskId}/submissions/files/${fileName}`),
}

export const gradingApi = {
  getQueue: () => api.get('/grades/queue'),
  getDetail: (id) => api.get(`/grades/submission/${id}`),
  grade: (submissionId, data) => api.post(`/grades/submission/${submissionId}`, data),
}

export const hrApi = {
  getSubmissionStats: () => api.get('/hr/submission-stats'),
  getGradingLogs: () => api.get('/hr/grading-logs'),
  getEngagementStats: () => api.get('/hr/engagement-stats'),
}

