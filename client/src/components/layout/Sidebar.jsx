/**
 * Sidebar Component
 * Navigation sidebar with links, active states, and mobile overlay
 */

import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Search, PackageSearch, PackagePlus,
  MessageCircle, Bell, User, Settings, X, Zap,
  MapPin, HandHeart, BarChart3, Shield,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      to: '/dashboard' },
  { icon: Search,          label: 'Search Items',   to: '/search' },
  { separator: true },
  { icon: PackageSearch,   label: 'Report Lost',    to: '/report/lost',  accent: 'danger' },
  { icon: PackagePlus,     label: 'Report Found',   to: '/report/found', accent: 'success' },
  { separator: true },
  { icon: Zap,             label: 'AI Matches',     to: '/matches' },
  { icon: MessageCircle,   label: 'Messages',       to: '/chats' },
  { icon: Bell,            label: 'Notifications',  to: '/notifications' },
  { separator: true },
  { icon: User,            label: 'Profile',        to: '/profile' },
  { icon: Settings,        label: 'Settings',       to: '/settings' },
]

export default function Sidebar({ open, onClose }) {
  const { user, isAdmin } = useAuth()

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-glow">
            <span className="text-white font-black text-base">F</span>
          </div>
          <div>
            <h1 className="font-black text-base leading-none text-white">FindIt</h1>
            <p className="text-[10px] text-primary-400 font-medium mt-0.5">AI Lost & Found</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden btn btn-ghost btn-icon btn-sm">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item, i) => {
          if (item.separator) return <div key={i} className="my-2 border-t border-white/5" />

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => clsx(
                'sidebar-link',
                isActive && 'active',
              )}
              id={`sidebar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}

        {/* Admin Link */}
        {isAdmin && (
          <>
            <div className="my-2 border-t border-white/5" />
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
            >
              <Shield size={18} className="shrink-0" />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Card */}
      <div className="p-3">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <img
            src={user?.avatar?.url || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}&backgroundColor=4f46e5&textColor=ffffff`}
            alt={user?.name}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-primary-500/30"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dark-100 truncate">{user?.name}</p>
            <p className="text-xs text-dark-200/50 truncate">{user?.email}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-success-500 shrink-0" title="Online" />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/5 bg-dark-900/50">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-dark-900 border-r border-white/5 z-50 lg:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
