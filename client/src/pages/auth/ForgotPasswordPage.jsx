/**
 * Forgot Password Page
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { authService } from '../../services'
import { Input, Button } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/index'

export default function ForgotPasswordPage() {
  useDocumentTitle('Forgot Password')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch { toast.error('Something went wrong.') }
    finally { setLoading(false) }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="text-2xl font-black mb-2">Check your inbox</h2>
        <p className="text-dark-100/50 text-sm mb-6">
          If an account exists with that email, we've sent a reset link. Check your spam folder too.
        </p>
        <Link to="/login" className="btn btn-secondary w-full">Back to Login</Link>
      </motion.div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black mb-2">Forgot your password?</h2>
        <p className="text-dark-100/50 text-sm">Enter your email and we'll send a reset link.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input label="Email Address" type="email" placeholder="you@example.com"
          icon={<Mail size={16} />} error={errors.email?.message} id="forgot-email"
          {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
        />
        <Button type="submit" loading={loading} icon={<Send size={16} />} className="w-full btn-lg" id="forgot-submit-btn">
          Send Reset Link
        </Button>
      </form>
      <p className="text-center text-sm text-dark-100/50 mt-6">
        Remember it? <Link to="/login" className="text-primary-400 font-semibold">Sign in</Link>
      </p>
    </div>
  )
}
