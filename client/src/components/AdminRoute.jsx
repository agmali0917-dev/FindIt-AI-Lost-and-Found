/**
 * Admin Route – Requires admin role
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'

export default function AdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
