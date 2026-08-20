/**
 * Settings Page
 */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { User, Lock, Bell, Shield } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { userService, authService } from '../services'
import { Input, Textarea, Button, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/index'

export default function SettingsPage() {
  useDocumentTitle('Settings')
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile',       label: 'Profile',       icon: User },
    { id: 'password',      label: 'Password',      icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  // ─── Profile Form ──────────────────────────────────────────────────────────
  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: user?.name, bio: user?.bio, phone: user?.phone },
  })

  const profileMutation = useMutation({
    mutationFn: (data) => {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => v && fd.append(k, v))
      return userService.updateProfile(fd)
    },
    onSuccess: ({ data }) => { updateUser(data.data); toast.success('Profile updated!') },
    onError:   () => toast.error('Update failed'),
  })

  // ─── Password Form ─────────────────────────────────────────────────────────
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm()

  const passwordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess:  () => { toast.success('Password changed!'); resetPwd() },
    onError:    (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  // ─── Notification Settings ─────────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    matchAlerts:        user?.settings?.matchAlerts        ?? true,
    pushNotifications:  user?.settings?.pushNotifications  ?? false,
  })

  const notifMutation = useMutation({
    mutationFn: userService.updateSettings,
    onSuccess:  ({ data }) => { updateUser(data.data); toast.success('Settings saved!') },
  })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-dark-100/50 hover:text-dark-100'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <form onSubmit={handleProfile(d => profileMutation.mutate(d))} className="space-y-5">
            <Input label="Full Name" placeholder="Your name" error={profileErrors.name?.message}
              id="settings-name" {...regProfile('name')} />
            <Textarea label="Bio" placeholder="Tell others about yourself..." rows={3}
              id="settings-bio" {...regProfile('bio')} />
            <Input label="Phone Number" type="tel" placeholder="+1 234 567 8900"
              id="settings-phone" {...regProfile('phone')} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="City" placeholder="New York" id="settings-city" {...regProfile('locationCity')} />
              <Input label="State" placeholder="NY" id="settings-state" {...regProfile('locationState')} />
              <Input label="Country" placeholder="USA" id="settings-country" {...regProfile('locationCountry')} />
            </div>
            <Button type="submit" loading={profileMutation.isPending} id="settings-profile-save">
              Save Profile
            </Button>
          </form>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <form onSubmit={handlePwd(d => passwordMutation.mutate(d))} className="space-y-5">
            <Input label="Current Password" type="password" placeholder="••••••••"
              id="settings-current-pwd" {...regPwd('currentPassword', { required: 'Required' })}
              error={pwdErrors.currentPassword?.message} />
            <Input label="New Password" type="password" placeholder="Min 8 chars"
              id="settings-new-pwd" {...regPwd('newPassword', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })}
              error={pwdErrors.newPassword?.message} />
            <Button type="submit" loading={passwordMutation.isPending} id="settings-pwd-save">
              Change Password
            </Button>
          </form>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive match alerts via email' },
              { key: 'matchAlerts',        label: 'Match Alerts',        description: 'Notify when AI finds a match' },
              { key: 'pushNotifications',  label: 'Push Notifications',  description: 'Browser push notifications' },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="font-semibold text-sm">{s.label}</p>
                  <p className="text-xs text-dark-100/40">{s.description}</p>
                </div>
                <button onClick={() => setNotifSettings(p => ({ ...p, [s.key]: !p[s.key] }))}
                  className={`w-10 h-5 rounded-full transition-colors ${notifSettings[s.key] ? 'bg-primary-600' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${notifSettings[s.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            ))}
          </div>
          <Button onClick={() => notifMutation.mutate(notifSettings)} loading={notifMutation.isPending} className="mt-4 w-full">
            Save Preferences
          </Button>
        </Card>
      )}
    </div>
  )
}
