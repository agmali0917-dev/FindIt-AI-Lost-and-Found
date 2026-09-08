/**
 * Register Page
 */

import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { useDocumentTitle } from '../../hooks/index'

export default function RegisterPage() {
  useDocumentTitle('Create Account')
  const navigate = useNavigate()
  const { googleLogin } = useAuth()

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential)
      toast.success('Welcome to FindIt! 👋')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google Sign-In failed.')
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black mb-2">Create your account</h2>
        <p className="text-dark-100/50 text-sm">Join FindIt and recover what's yours</p>
      </div>

      <div className="flex flex-col items-center justify-center mt-6 space-y-6">
        <div className="w-full flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google Sign-In was cancelled or failed.')}
            useOneTap
            shape="pill"
            theme="filled_blue"
            text="continue_with_google"
          />
        </div>
      </div>

      <p className="text-xs text-dark-100/30 text-center mt-8">
        By creating an account, you agree to our{' '}
        <a href="#" className="text-primary-400">Terms of Service</a> and{' '}
        <a href="#" className="text-primary-400">Privacy Policy</a>.
      </p>

      <p className="text-center text-dark-100/50 text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-400 font-semibold">Sign in</Link>
      </p>
    </div>
  )
}
