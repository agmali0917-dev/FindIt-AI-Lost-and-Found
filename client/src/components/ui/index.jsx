/**
 * Reusable UI Components
 * Button, Input, Badge, Spinner, Avatar, Card, Modal
 */

import { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import clsx from 'clsx'

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = forwardRef(({
  children, variant = 'primary', size = 'md',
  loading = false, icon, iconRight, className = '',
  disabled, ...props
}, ref) => {
  const variants = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    accent:    'btn-accent',
    danger:    'btn-danger',
    ghost:     'btn-ghost',
    outline:   'btn-secondary',
  }
  const sizes = { sm: 'btn-sm', md: '', lg: 'btn-lg', xl: 'btn-xl', icon: 'btn-icon' }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx('btn', variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
})
Button.displayName = 'Button'

// ─── Input ───────────────────────────────────────────────────────────────────
export const Input = forwardRef(({
  label, error, hint, icon, className = '', wrapperClass = '', ...props
}, ref) => (
  <div className={clsx('space-y-1.5', wrapperClass)}>
    {label && <label className="label">{label}</label>}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200/50">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={clsx('input', icon && 'pl-9', error && 'input-error', className)}
        {...props}
      />
    </div>
    {error && <p className="text-danger-400 text-xs flex items-center gap-1">{error}</p>}
    {hint && !error && <p className="text-dark-200/50 text-xs">{hint}</p>}
  </div>
))
Input.displayName = 'Input'

// ─── TextArea ────────────────────────────────────────────────────────────────
export const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <textarea
      ref={ref}
      className={clsx('input resize-none', error && 'input-error', className)}
      {...props}
    />
    {error && <p className="text-danger-400 text-xs">{error}</p>}
  </div>
))
Textarea.displayName = 'Textarea'

// ─── Select ──────────────────────────────────────────────────────────────────
export const Select = forwardRef(({ label, error, children, className = '', ...props }, ref) => (
  <div className="space-y-1.5">
    {label && <label className="label">{label}</label>}
    <select ref={ref} className={clsx('input select', error && 'input-error', className)} {...props}>
      {children}
    </select>
    {error && <p className="text-danger-400 text-xs">{error}</p>}
  </div>
))
Select.displayName = 'Select'

// ─── Badge ───────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'badge-primary', accent: 'badge-accent',
    success: 'badge-success', warning: 'badge-warning', danger: 'badge-danger',
  }
  return (
    <span className={clsx('badge', variants[variant], className)} {...props}>
      {children}
    </span>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8', xl: 'w-12 h-12' }
  return (
    <Loader2 className={clsx('animate-spin text-primary-500', sizes[size], className)} />
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
export const Avatar = ({ src, name, size = 'md', className = '', online }) => {
  const sizes = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12', xl: 'w-16 h-16' }
  const fallback = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name || 'U')}&backgroundColor=4f46e5&textColor=ffffff`

  return (
    <div className={clsx('relative inline-block', className)}>
      <img
        src={src || fallback}
        alt={name}
        className={clsx('rounded-full object-cover ring-2 ring-white/10', sizes[size])}
        onError={e => { e.target.src = fallback }}
      />
      {online !== undefined && (
        <span className={clsx(
          'absolute bottom-0 right-0 rounded-full border-2 border-dark-900',
          online ? 'bg-success-500' : 'bg-dark-700',
          size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
        )} />
      )}
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', hover = false, ...props }) => (
  <div className={clsx('card', hover && 'card-hover cursor-pointer', className)} {...props}>
    {children}
  </div>
)

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-5xl' }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 overlay"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={clsx('relative glass rounded-2xl w-full shadow-float overflow-hidden', sizes[size], className)}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
                <h3 className="font-bold text-lg">{title}</h3>
                <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
                  <X size={18} />
                </button>
              </div>
            )}
            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export const Skeleton = ({ className = '', ...props }) => (
  <div className={clsx('skeleton', className)} {...props} />
)

// ─── Empty State ─────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon size={28} className="text-dark-200/50" />
      </div>
    )}
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    {description && <p className="text-dark-200/50 text-sm max-w-xs mb-6">{description}</p>}
    {action}
  </div>
)

// ─── Confidence Meter ────────────────────────────────────────────────────────
export const ConfidenceMeter = ({ score, label }) => {
  const percentage = Math.round(score * 100)
  const getColor = (s) => {
    if (s >= 0.95) return 'from-success-500 to-accent-500'
    if (s >= 0.90) return 'from-accent-500 to-primary-500'
    if (s >= 0.85) return 'from-primary-500 to-warning-500'
    return 'from-warning-500 to-danger-500'
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-dark-200/50">{label}</span>
          <span className="font-bold text-dark-100">{percentage}%</span>
        </div>
      )}
      <div className="confidence-bar">
        <motion.div
          className={clsx('confidence-fill bg-gradient-to-r', getColor(score))}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
