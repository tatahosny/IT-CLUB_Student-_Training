import api from '../services/api'

export const taskApi = {
  getAll: () => api.get('/tasks'),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  submit: (taskId, formData) => api.post(`/tasks/${taskId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSubmissions: (taskId) => api.get(`/tasks/${taskId}/submissions`),
  getMySubmissions: () => api.get('/tasks/my/submissions'),
}

export const gradingApi = {
  getQueue: () => api.get('/grades/queue'),
  getDetail: (id) => api.get(`/grades/submission/${id}`),
  grade: (submissionId, data) => api.post(`/grades/submission/${submissionId}`, data),
}
