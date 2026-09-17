import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export default function ProtectedRoute({ children, requireStaff = false, requireSuperuser = false }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (requireStaff && !user.is_staff) return <Navigate to="/" replace />
  if (requireSuperuser && !user.is_superuser) return <Navigate to="/" replace />

  return children
}
