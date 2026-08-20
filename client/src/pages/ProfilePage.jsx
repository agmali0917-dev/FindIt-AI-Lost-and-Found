/**
 * Profile Page
 */
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { User, MapPin, Calendar, Package, PackagePlus, CheckCircle } from 'lucide-react'
import { userService } from '../services'
import { Avatar, Badge, Card, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/index'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const userId   = id || user?._id

  const { data, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn:  () => userService.getProfile(id),
    select:   d => d.data.data,
  })

  useDocumentTitle(data?.name || 'Profile')

  const { data: activity } = useQuery({
    queryKey: ['activity', userId],
    queryFn:  () => userService.getActivity(id),
    select:   d => d.data.data,
  })

  if (isLoading) return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>
    </div>
  )

  if (!data) return <div className="p-6 text-center text-dark-100/50">User not found</div>

  const stats = [
    { icon: Package,    label: 'Lost Reported', value: data.stats?.lostItemsReported  || 0 },
    { icon: PackagePlus,label: 'Found Reports',  value: data.stats?.foundItemsReported || 0 },
    { icon: CheckCircle,label: 'Successful',     value: data.stats?.successfulMatches  || 0 },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Profile Card */}
      <Card className="mb-6">
        <div className="flex items-start gap-5">
          <Avatar src={data.avatar?.url} name={data.name} size="xl" />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-black">{data.name}</h1>
              {data.role === 'admin' && <Badge variant="primary">Admin</Badge>}
              {data.isEmailVerified && <Badge variant="success">✓ Verified</Badge>}
            </div>
            {data.bio && <p className="text-dark-100/60 text-sm mb-3">{data.bio}</p>}
            <div className="flex flex-wrap gap-4 text-xs text-dark-100/40">
              {data.location?.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {data.location.city}, {data.location.country}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Joined {format(new Date(data.createdAt), 'MMM yyyy')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <Card key={s.label} className="text-center">
            <s.icon size={20} className="text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-black mb-1">{s.value}</div>
            <div className="text-xs text-dark-100/40">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      {activity && (
        <div className="grid sm:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-bold text-sm mb-3">Recent Lost Items</h3>
            <div className="space-y-2">
              {activity.lostItems?.length ? activity.lostItems.slice(0, 3).map(item => (
                <div key={item._id} className="flex items-center gap-2">
                  <img src={item.images?.[0]?.url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  <p className="text-xs truncate">{item.title}</p>
                </div>
              )) : <p className="text-xs text-dark-100/40">No items yet</p>}
            </div>
          </Card>
          <Card>
            <h3 className="font-bold text-sm mb-3">Recent Found Reports</h3>
            <div className="space-y-2">
              {activity.foundItems?.length ? activity.foundItems.slice(0, 3).map(item => (
                <div key={item._id} className="flex items-center gap-2">
                  <img src={item.images?.[0]?.url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  <p className="text-xs truncate">{item.title}</p>
                </div>
              )) : <p className="text-xs text-dark-100/40">No items yet</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
