/**
 * Register Page
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Phone } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { authService } from '../../services'
import { Input, Button } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/index'

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Please enter a valid email'),
  password:        z.string().min(8, 'Password must be at least 8 characters')
                    .regex(/[A-Z]/, 'Must contain an uppercase letter')
                    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
  phone:           z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export default function RegisterPage() {
  useDocumentTitle('Create Account')
  const navigate = useNavigate()
  const [showPwd,    setShowPwd]    = useState(false)
  const [showConfirm,setShowConfirm]= useState(false)
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.register({
        name: data.name, email: data.email,
        password: data.password, phone: data.phone,
      })
      setSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-success-500/10 border border-success-500/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📧</span>
        </div>
        <h2 className="text-2xl font-black mb-2">Check your email</h2>
        <p className="text-dark-100/50 text-sm mb-6">
          We sent a verification link to your email. Click it to activate your account.
        </p>
        <Link to="/login" className="btn btn-primary w-full">
          Go to Login
        </Link>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black mb-2">Create your account</h2>
        <p className="text-dark-100/50 text-sm">Join FindIt and recover what's yours</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          icon={<User size={16} />}
          error={errors.name?.message}
          id="register-name"
          {...register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          id="register-email"
          {...register('email')}
        />

        <Input
          label="Phone (optional)"
          type="tel"
          placeholder="+1 234 567 8900"
          icon={<Phone size={16} />}
          error={errors.phone?.message}
          id="register-phone"
          {...register('phone')}
        />

        {/* Password */}
        <div className="space-y-1.5">
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200/50" />
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
              id="register-password"
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-200/50">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-danger-400 text-xs">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="label">Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200/50" />
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat password"
              className={`input pl-9 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
              id="register-confirm-password"
              {...register('confirmPassword')}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-200/50">
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-danger-400 text-xs">{errors.confirmPassword.message}</p>}
        </div>

        <Button
          type="submit"
          loading={loading}
          icon={<UserPlus size={16} />}
          className="w-full btn-lg"
          id="register-submit-btn"
        >
          Create Account
        </Button>

        <p className="text-xs text-dark-100/30 text-center">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-primary-400">Terms of Service</a> and{' '}
          <a href="#" className="text-primary-400">Privacy Policy</a>.
        </p>
      </form>

      <p className="text-center text-dark-100/50 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 font-semibold">Sign in</Link>
      </p>
    </div>
  )
}
