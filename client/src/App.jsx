/**
 * App.jsx – Root Router
 * All routes, protected routes, and layout wrappers
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import PageLoader from './components/ui/PageLoader'

// ─── Lazy Pages ───────────────────────────────────────────────────────────────
// Auth
const LandingPage      = lazy(() => import('./pages/LandingPage'))
const LoginPage        = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage     = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPassword   = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPassword    = lazy(() => import('./pages/auth/ResetPasswordPage'))

// App
const DashboardPage    = lazy(() => import('./pages/DashboardPage'))
const SearchPage       = lazy(() => import('./pages/SearchPage'))
const ProfilePage      = lazy(() => import('./pages/ProfilePage'))
const SettingsPage     = lazy(() => import('./pages/SettingsPage'))
const NotificationsPage= lazy(() => import('./pages/NotificationsPage'))

// Items
const ReportLostPage   = lazy(() => import('./pages/items/ReportLostPage'))
const ReportFoundPage  = lazy(() => import('./pages/items/ReportFoundPage'))
const LostItemDetail   = lazy(() => import('./pages/items/LostItemDetail'))
const FoundItemDetail  = lazy(() => import('./pages/items/FoundItemDetail'))
const EditLostItemPage = lazy(() => import('./pages/items/EditLostItemPage'))

// Matches & Chat
const MatchesPage      = lazy(() => import('./pages/MatchesPage'))
const MatchDetail      = lazy(() => import('./pages/MatchDetail'))
const ChatPage         = lazy(() => import('./pages/ChatPage'))

// Admin
const AdminLayout      = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers       = lazy(() => import('./pages/admin/AdminUsers'))
const AdminItems       = lazy(() => import('./pages/admin/AdminItems'))
const AdminAnalytics   = lazy(() => import('./pages/admin/AdminAnalytics'))

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ─── Public ─── */}
            <Route path="/" element={<LandingPage />} />

            {/* ─── Auth Layout ─── */}
            <Route element={<AuthLayout />}>
              <Route path="/login"                    element={<LoginPage />} />
              <Route path="/register"                 element={<RegisterPage />} />
              <Route path="/forgot-password"          element={<ForgotPassword />} />
              <Route path="/reset-password/:token"    element={<ResetPassword />} />
            </Route>

            {/* ─── Main App Layout (protected) ─── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard"              element={<DashboardPage />} />
                <Route path="/search"                 element={<SearchPage />} />
                <Route path="/profile"                element={<ProfilePage />} />
                <Route path="/profile/:id"            element={<ProfilePage />} />
                <Route path="/settings"               element={<SettingsPage />} />
                <Route path="/notifications"          element={<NotificationsPage />} />

                {/* Items */}
                <Route path="/report/lost"            element={<ReportLostPage />} />
                <Route path="/report/found"           element={<ReportFoundPage />} />
                <Route path="/items/lost/:id"         element={<LostItemDetail />} />
                <Route path="/items/found/:id"        element={<FoundItemDetail />} />
                <Route path="/items/lost/:id/edit"    element={<EditLostItemPage />} />

                {/* Matches */}
                <Route path="/matches"                element={<MatchesPage />} />
                <Route path="/matches/:id"            element={<MatchDetail />} />

                {/* Chat */}
                <Route path="/chats"                  element={<ChatPage />} />
                <Route path="/chats/:chatId"          element={<ChatPage />} />
              </Route>
            </Route>

            {/* ─── Admin Panel ─── */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index                          element={<AdminDashboard />} />
                <Route path="users"                   element={<AdminUsers />} />
                <Route path="items"                   element={<AdminItems />} />
                <Route path="analytics"               element={<AdminAnalytics />} />
              </Route>
            </Route>

            {/* ─── 404 ─── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SocketProvider>
    </AuthProvider>
  )
}
