/**
 * Admin Layout
 */
import { Outlet, NavLink } from 'react-router-dom'
import { BarChart3, Users, Package, LayoutDashboard, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

const adminNav = [
  { to: '/admin',           label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users',     label: 'Users',     icon: Users },
  { to: '/admin/items',     label: 'Items',     icon: Package },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout() {
  return (
    <div className="flex h-screen">
      <aside className="w-56 shrink-0 bg-dark-950 border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <p className="text-xs font-bold text-primary-400 uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}>
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/5">
          <NavLink to="/dashboard" className="sidebar-link text-dark-100/40">
            <ArrowLeft size={16} /> Back to App
          </NavLink>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
