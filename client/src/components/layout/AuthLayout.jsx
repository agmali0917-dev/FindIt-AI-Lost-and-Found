/**
 * Auth Layout – Centered auth pages with glass card
 */
import { Outlet, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLayout() {
  return (
    <div className="min-h-screen hero-bg flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-black text-sm">F</div>
          <span className="font-bold text-lg text-white">FindIt</span>
        </Link>
      </div>

      {/* Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-3xl p-8 shadow-card-dark">
            <Outlet />
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <p className="text-center text-dark-200/50 text-xs p-6">
        © {new Date().getFullYear()} FindIt. All rights reserved.
      </p>
    </div>
  )
}
