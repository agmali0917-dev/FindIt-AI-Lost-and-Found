/**
 * Navbar Component
 * Top navigation with search, notifications, user menu
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, Search, Bell, Plus, LogOut, User, Settings,
  Shield, ChevronDown, X, Loader2,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { notificationService, searchService } from '../../services'
import { useDebounce } from '../../hooks/useDebounce'

export default function Navbar({ onMenuClick }) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [searchQuery,      setSearchQuery]      = useState('')
  const [searchOpen,       setSearchOpen]       = useState(false)
  const [userMenuOpen,     setUserMenuOpen]     = useState(false)
  const [suggestions,      setSuggestions]      = useState([])

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searchRef = useRef(null)

  // ─── Notifications unread count ─────────────────────────────────────────────
  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn:  () => notificationService.getAll({ unreadOnly: true, limit: 1 }),
    select:   (d) => d.data.data.unreadCount,
    refetchInterval: 30000, // every 30s
  })
  const unreadCount = notifData || 0

  // ─── Search Suggestions ──────────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchService.suggestions(debouncedSearch)
        .then(({ data }) => setSuggestions(data.data || []))
        .catch(() => setSuggestions([]))
    } else {
      setSuggestions([])
    }
  }, [debouncedSearch])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 glass-dark border-b border-white/5">
      <div className="flex items-center gap-4 px-4 lg:px-6 h-16">

        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden btn btn-ghost btn-icon"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Logo (mobile) */}
        <Link to="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-black text-xs">F</div>
          <span className="font-bold text-sm">FindIt</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block relative">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200/50" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search lost & found items..."
              className="input pl-9 text-sm"
              aria-label="Search items"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-200/50 hover:text-dark-100">
                <X size={14} />
              </button>
            )}
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {searchOpen && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 left-0 right-0 glass rounded-xl overflow-hidden shadow-float z-50"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(s.title)
                      navigate(`/search?q=${encodeURIComponent(s.title)}`)
                      setSearchOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
                  >
                    <Search size={14} className="text-dark-200/50 shrink-0" />
                    <div>
                      <span className="text-dark-100">{s.title}</span>
                      <span className="text-dark-200/50 text-xs ml-2">{s.category}</span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Click outside to close search */}
        {searchOpen && <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />}

        <div className="flex items-center gap-2 ml-auto">
          {/* Report Lost Button */}
          <Link
            to="/report/lost"
            className="hidden sm:flex btn btn-primary btn-sm gap-1.5"
            id="nav-report-lost-btn"
          >
            <Plus size={14} />
            <span>Report Lost</span>
          </Link>

          {/* Notifications */}
          <Link
            to="/notifications"
            className="btn btn-ghost btn-icon relative"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-dot">
                {unreadCount > 9 ? '' : ''}
              </span>
            )}
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              id="nav-user-menu-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors"
            >
              <img
                src={user?.avatar?.url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}&backgroundColor=4f46e5&textColor=ffffff`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
              />
              <ChevronDown size={14} className="text-dark-200/50 hidden sm:block" />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl overflow-hidden shadow-float z-50"
                  >
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="font-semibold text-sm text-dark-100">{user?.name}</p>
                      <p className="text-xs text-dark-200/50 truncate">{user?.email}</p>
                    </div>

                    <div className="p-1.5">
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                        className="sidebar-link">
                        <User size={16} /> Profile
                      </Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                        className="sidebar-link">
                        <Settings size={16} /> Settings
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="sidebar-link">
                          <Shield size={16} /> Admin Panel
                        </Link>
                      )}
                      <hr className="divider !my-1" />
                      <button onClick={handleLogout}
                        className="sidebar-link w-full text-danger-400 hover:bg-danger-500/10">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
