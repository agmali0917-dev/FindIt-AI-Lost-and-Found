/**
 * Email Verification Page
 */
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { authService } from '../../services'
import { useDocumentTitle } from '../../hooks/index'

export default function VerifyEmailPage() {
  useDocumentTitle('Verify Email')
  const { token } = useParams()
  const [status,  setStatus]  = useState('loading') // loading | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    authService.verifyEmail(token)
      .then(({ data }) => { setStatus('success'); setMessage(data.message) })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed.') })
  }, [token])

  return (
    <div className="text-center">
      {status === 'loading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 size={48} className="animate-spin text-primary-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">Verifying your email...</h2>
        </motion.div>
      )}

      {status === 'success' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-16 h-16 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-success-500" />
          </div>
          <h2 className="text-2xl font-black mb-2">Email Verified! 🎉</h2>
          <p className="text-dark-100/50 text-sm mb-6">{message}</p>
          <Link to="/login" className="btn btn-primary w-full">Continue to Login</Link>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-16 h-16 rounded-full bg-danger-500/10 flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-danger-500" />
          </div>
          <h2 className="text-2xl font-black mb-2">Verification Failed</h2>
          <p className="text-dark-100/50 text-sm mb-6">{message}</p>
          <Link to="/login" className="btn btn-secondary w-full">Back to Login</Link>
        </motion.div>
      )}
    </div>
  )
}
