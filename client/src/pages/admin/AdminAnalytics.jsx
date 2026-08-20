/**
 * Admin Analytics Page
 */
import { useDocumentTitle } from '../../hooks/index'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services'
import { Card, Skeleton } from '../../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'

export default function AdminAnalytics() {
  useDocumentTitle('Admin – Analytics')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  adminService.getStats,
    select:   d => d.data.data,
  })

  if (isLoading) return <div className="p-6 space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-80" />)}</div>

  const monthly    = data?.monthlyTrend || []
  const categories = data?.categoryBreakdown || []
  const overview   = data?.overview || {}

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-black">Analytics</h1>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Items',      value: overview.totalLostItems + overview.totalFoundItems },
          { label: 'Total Matches',    value: overview.totalMatches },
          { label: 'Success Rate',     value: `${overview.successRate}%` },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <div className="text-3xl font-black gradient-text-primary">{s.value}</div>
            <div className="text-xs text-dark-100/40 mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="font-bold mb-4">Monthly Lost vs Found</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="lost"  name="Lost"  fill="#f43f5e" radius={[4,4,0,0]} />
            <Bar dataKey="found" name="Found" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="matches" name="Matches" fill="#4f46e5" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h2 className="font-bold mb-4">Top Categories</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={categories} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis dataKey="category" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
            <Bar dataKey="count" fill="#4f46e5" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
