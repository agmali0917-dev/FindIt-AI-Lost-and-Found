/**
 * Admin Dashboard
 */
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Package, Zap, CheckCircle, TrendingUp } from 'lucide-react'
import { adminService } from '../../services'
import { Card, Skeleton } from '../../components/ui'
import { useDocumentTitle } from '../../hooks/index'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#4f46e5', '#06b6d4', '#22c55e', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#6366f1']

const StatCard = ({ icon: Icon, label, value, sub, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="card">
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
      <Icon size={18} className="text-white" />
    </div>
    <div className="text-2xl font-black mb-0.5">{value}</div>
    <div className="text-dark-100/50 text-xs">{label}</div>
    {sub && <div className="text-xs text-success-400 mt-1">{sub}</div>}
  </motion.div>
)

export default function AdminDashboard() {
  useDocumentTitle('Admin Dashboard')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  adminService.getStats,
    select:   d => d.data.data,
    refetchInterval: 60000,
  })

  if (isLoading) return (
    <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
    </div>
  )

  const overview     = data?.overview || {}
  const monthlyTrend = data?.monthlyTrend || []
  const categories   = data?.categoryBreakdown || []

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users}       label="Total Users"        value={overview.totalUsers}       sub={`+${overview.newUsersThisMonth} this month`} color="from-primary-500 to-violet-600" delay={0} />
        <StatCard icon={Package}     label="Lost Items"         value={overview.totalLostItems}   sub={`${overview.activeLostItems} active`}         color="from-danger-500 to-rose-600"    delay={0.05} />
        <StatCard icon={Package}     label="Found Items"        value={overview.totalFoundItems}  sub={`${overview.activeFoundItems} active`}         color="from-success-500 to-teal-600"   delay={0.1} />
        <StatCard icon={CheckCircle} label="Successful Returns" value={overview.returnedItems}    sub={`${overview.successRate}% success rate`}       color="from-accent-500 to-blue-600"    delay={0.15} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="font-bold mb-4">Monthly Activity</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="lost"  name="Lost"  stroke="#f43f5e" fill="url(#colorLost)"  strokeWidth={2} />
                <Area type="monotone" dataKey="found" name="Found" stroke="#22c55e" fill="url(#colorFound)" strokeWidth={2} />
                <Area type="monotone" dataKey="matches" name="Matches" stroke="#4f46e5" strokeWidth={2} dot={false} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Category Pie */}
        <Card>
          <h2 className="font-bold mb-4">Top Categories</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={70}>
                {categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
