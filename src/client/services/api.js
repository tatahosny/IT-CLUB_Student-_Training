import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }

    // Attach device fingerprint from localStorage
    const fingerprint = localStorage.getItem('device_fingerprint')
    if (fingerprint) {
      config.headers['X-Device-Fingerprint'] = fingerprint
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401, auto-refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isLoginRequest = originalRequest.url.includes('/auth/login')

    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true

      try {
        const { refreshToken, setAccessToken, logout } = useAuthStore.getState()
        if (!refreshToken) {
          logout()
          // Dispatch event instead of full page reload
          window.dispatchEvent(new CustomEvent('auth:logout'))
          return Promise.reject(error)
        }

        const response = await axios.post('/api/auth/refresh', { refreshToken })
        const newAccessToken = response.data.data.accessToken
        setAccessToken(newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        // Dispatch event instead of full page reload
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      }
    }

    // Global error message handler (except for login which handles its own errors)
    if (!isLoginRequest) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      
      if (status !== 401) { // 401 is handled above or by auth logic
        import('react-hot-toast').then(({ default: toast }) => {
          toast.error(message);
        });
      }
    }

    return Promise.reject(error)
  }
)

export default api
