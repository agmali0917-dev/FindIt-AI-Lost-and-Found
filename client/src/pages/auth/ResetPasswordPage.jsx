/**
 * Reset Password Page
 */
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { authService } from '../../services'
import { Button } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/index'

const schema = z.object({
  password:        z.string().min(8, 'Minimum 8 characters').regex(/[A-Z]/, 'Need uppercase').regex(/[0-9]/, 'Need number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] })

export default function ResetPasswordPage() {
  useDocumentTitle('Reset Password')
  const { token }  = useParams()
  const navigate   = useNavigate()
  const [show,     setShow]    = useState(false)
  const [loading,  setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ password }) => {
    setLoading(true)
    try {
      await authService.resetPassword(token, password)
      toast.success('Password reset! Please log in with your new password.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black mb-2">Set new password</h2>
        <p className="text-dark-100/50 text-sm">Choose a strong new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {['password', 'confirmPassword'].map((field, i) => (
          <div key={field} className="space-y-1.5">
            <label className="label">{i === 0 ? 'New Password' : 'Confirm Password'}</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-200/50" />
              <input type={show ? 'text' : 'password'} placeholder="••••••••"
                className={`input pl-9 pr-10 ${errors[field] ? 'input-error' : ''}`}
                id={`reset-${field}`} {...register(field)} />
              {i === 0 && (
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-200/50">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
            {errors[field] && <p className="text-danger-400 text-xs">{errors[field].message}</p>}
          </div>
        ))}
        <Button type="submit" loading={loading} icon={<KeyRound size={16} />} className="w-full btn-lg" id="reset-submit-btn">
          Reset Password
        </Button>
      </form>
    </div>
  )
}
