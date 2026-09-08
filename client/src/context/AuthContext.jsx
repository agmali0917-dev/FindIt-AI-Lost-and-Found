/**
 * Auth Context
 * Provides user state, login, logout across the entire app
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // ─── Initialize from localStorage ───────────────────────────────────────────
  useEffect(() => {
    const storedUser  = localStorage.getItem('user')
    const accessToken = localStorage.getItem('accessToken')

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser))
      // Silently refresh to validate token
      authService.getMe()
        .then(({ data }) => {
          setUser(data.data)
          localStorage.setItem('user', JSON.stringify(data.data))
        })
        .catch(() => {
          // Token invalid – clear storage
          localStorage.clear()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // ─── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials)
    const { user, accessToken, refreshToken } = data.data
    localStorage.setItem('user',          JSON.stringify(user))
    localStorage.setItem('accessToken',   accessToken)
    localStorage.setItem('refreshToken',  refreshToken)
    setUser(user)
    return user
  }, [])

  // ─── Google Login ─────────────────────────────────────────────────────────────
  const googleLogin = useCallback(async (credential) => {
    const { data } = await authService.googleLogin({ credential })
    const { user, accessToken, refreshToken } = data.data
    localStorage.setItem('user',          JSON.stringify(user))
    localStorage.setItem('accessToken',   accessToken)
    localStorage.setItem('refreshToken',  refreshToken)
    setUser(user)
    return user
  }, [])

  // ─── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authService.logout() } catch { /* ignore */ }
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  // ─── Update User ──────────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }, [])

  const isAdmin = user?.role === 'admin'
  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated, isAdmin,
      login, googleLogin, logout, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
