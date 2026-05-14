import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.first_login && location.pathname !== '/first-login') return <Navigate to="/first-login" replace />
  if (!user?.first_login && location.pathname === '/first-login') return <Navigate to="/" replace />
  
  return children
}
