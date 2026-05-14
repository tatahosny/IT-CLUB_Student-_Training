import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function RoleRoute({ roles, children }) {
  const { user } = useAuthStore()
  if (!user || !roles.includes(user.role?.role_name)) return <Navigate to="/" replace />
  return children
}
