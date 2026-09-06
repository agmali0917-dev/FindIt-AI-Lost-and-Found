/**
 * Login Page
 */

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import { Input, Button } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/index'

const schema = z.object({
  email:    z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  useDocumentTitle('Sign In')
  const { login, googleLogin } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await login(data)
      toast.success('Welcome back! 👋')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential)
      toast.success('Welcome back! 👋')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Sign-In failed.')
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black mb-2">Welcome back</h2>
        <p className="text-dark-100/50 text-sm">Sign in to your FindIt account</p>
      </div>

      <div className="flex flex-col items-center justify-center mt-6 mb-6">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google Sign-In was cancelled or failed.')}
          useOneTap
          shape="pill"
          theme="filled_blue"
          text="continue_with_google"
        />
      </div>

      <div className="relative flex py-4 items-center mb-4">
        <div className="flex-grow border-t border-dark-200/30"></div>
        <span className="flex-shrink-0 mx-4 text-dark-100/50 text-xs font-semibold">OR LOG IN WITH EMAIL</span>
        <div className="flex-grow border-t border-dark-200/30"></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          icon={<Mail size={16} />}
          error={errors.email?.message}
          id="login-email"
          {...register('email')}
        />

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="label">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary-400 hover:text-primary-300 font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200/50" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
              id="login-password"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-200/50 hover:text-dark-100"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-danger-400 text-xs">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          loading={loading}
          icon={<LogIn size={16} />}
          className="w-full btn-lg"
          id="login-submit-btn"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-dark-100/50 text-sm mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
          Create one free
        </Link>
      </p>
    </div>
  )
}
