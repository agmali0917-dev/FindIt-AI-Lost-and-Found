/**
 * Protected Route – Redirects to /login if not authenticated
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageLoader />
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
