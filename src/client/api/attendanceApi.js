import api from '../services/api'

export const attendanceApi = {
  scanQR: (data) => api.post('/attendance/scan', data),
  getMyQR: (sessionId) => api.get(`/attendance/my-qr/${sessionId}`),
  getSessionAttendance: (sessionId) => api.get(`/attendance/session/${sessionId}`),
  getHistory: () => api.get('/attendance/history'),
  getStudentHistory: (studentId) => api.get(`/attendance/history/${studentId}`),
  markManual: (data) => api.post('/attendance/manual', data),
  getWorkshopQR: (sessionId, duration) => api.get(`/attendance/workshop-qr/${sessionId}${duration ? `?duration=${duration}` : ''}`),
}
