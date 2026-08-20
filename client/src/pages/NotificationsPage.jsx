/**
 * Notifications Page
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Trash2, Zap, MessageCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { notificationService } from '../services'
import { EmptyState, Skeleton } from '../components/ui'
import { useDocumentTitle } from '../hooks/index'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

const TYPE_CONFIG = {
  match_found:    { icon: Zap,           color: 'text-primary-400' },
  match_confirmed:{ icon: CheckCheck,    color: 'text-success-400' },
  match_rejected: { icon: AlertCircle,   color: 'text-danger-400' },
  message:        { icon: MessageCircle, color: 'text-accent-400' },
  default:        { icon: Bell,          color: 'text-dark-100/50' },
}

export default function NotificationsPage() {
  useDocumentTitle('Notifications')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationService.getAll({ limit: 30 }),
    select:   d => d.data.data,
  })

  const markAllMutation = useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const notifications = data?.notifications || []
  const unread = data?.unreadCount || 0

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Bell size={24} className="text-primary-400" /> Notifications
            {unread > 0 && <span className="badge badge-danger text-xs">{unread}</span>}
          </h1>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn btn-ghost btn-sm gap-1.5 text-dark-100/50">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default
            const Icon = config.icon

            return (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={clsx(
                  'flex items-start gap-3 p-4 rounded-2xl transition-all',
                  !notif.isRead ? 'bg-white/5 border border-white/8' : 'hover:bg-white/3'
                )}
              >
                <div className={clsx('w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0', config.color)}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  {notif.data?.url ? (
                    <Link to={notif.data.url} onClick={() => {
                      if (!notif.isRead) notificationService.markRead(notif._id).then(() =>
                        queryClient.invalidateQueries({ queryKey: ['notifications'] })
                      )
                    }}>
                      <p className="font-semibold text-sm">{notif.title}</p>
                    </Link>
                  ) : (
                    <p className="font-semibold text-sm">{notif.title}</p>
                  )}
                  <p className="text-xs text-dark-100/50 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-dark-100/30 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
