/**
 * Dashboard Page
 * User's home: stats, recent items, matches, quick actions
 */

import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  PackageSearch, PackagePlus, Zap, MessageCircle,
  TrendingUp, Eye, Clock, Plus, ArrowRight,
  AlertCircle, CheckCircle2, BarChart3,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { lostItemService, foundItemService, matchService } from '../services'
import { Card, Badge, Skeleton, EmptyState, Avatar } from '../components/ui'
import { useDocumentTitle } from '../hooks/index'
import { formatDistanceToNow } from 'date-fns'

// ─── Item Card Mini ───────────────────────────────────────────────────────────
const ItemCardMini = ({ item, type }) => (
  <Link
    to={`/items/${type}/${item._id}`}
    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
  >
    <img
      src={item.images?.[0]?.url}
      alt={item.title}
      className="w-12 h-12 rounded-xl object-cover shrink-0 ring-1 ring-white/10"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate group-hover:text-primary-300 transition-colors">
        {item.title}
      </p>
      <p className="text-xs text-dark-100/50 truncate">{item.category}</p>
    </div>
    <div className="flex flex-col items-end gap-1 shrink-0">
      <Badge variant={item.status === 'active' ? 'success' : item.status === 'matched' ? 'primary' : 'warning'}>
        {item.status}
      </Badge>
      <span className="text-[10px] text-dark-100/40">
        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
      </span>
    </div>
  </Link>
)

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, change, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <Icon size={18} className="text-white" />
      </div>
      {change !== undefined && (
        <span className={`text-xs font-semibold flex items-center gap-1 ${change >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
          <TrendingUp size={12} />
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-black mb-1">{value}</div>
    <div className="text-dark-100/50 text-xs">{label}</div>
  </motion.div>
)

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  useDocumentTitle('Dashboard')
  const { user } = useAuth()

  const { data: lostData,    isLoading: lostLoading   } = useQuery({
    queryKey: ['myLostItems'],
    queryFn:  () => lostItemService.getMine({ limit: 5 }),
    select:   d => d.data.data,
  })

  const { data: foundData,   isLoading: foundLoading  } = useQuery({
    queryKey: ['myFoundItems'],
    queryFn:  () => foundItemService.getMine({ limit: 5 }),
    select:   d => d.data.data,
  })

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['myMatches'],
    queryFn:  () => matchService.getAll({ limit: 5, status: 'pending' }),
    select:   d => d.data.data,
  })

  const totalLost    = lostData?.pagination?.total    || 0
  const totalFound   = foundData?.pagination?.total   || 0
  const totalMatches = matchesData?.pagination?.total || 0

  const stats = [
    { icon: PackageSearch, label: 'Lost Items Reported', value: totalLost,    color: 'from-danger-500 to-rose-600',    delay: 0 },
    { icon: PackagePlus,   label: 'Found Items Reported', value: totalFound,  color: 'from-success-500 to-teal-600',   delay: 0.05 },
    { icon: Zap,           label: 'Pending Matches',      value: totalMatches,color: 'from-primary-500 to-violet-600', delay: 0.1 },
    { icon: CheckCircle2,  label: 'Successful Returns',   value: user?.stats?.successfulMatches || 0, color: 'from-accent-500 to-blue-600', delay: 0.15 },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black mb-1">
          Welcome back, <span className="gradient-text-primary">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-dark-100/50 text-sm">Here's what's happening with your items.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid sm:grid-cols-2 gap-4 mb-8"
      >
        <Link to="/report/lost"
          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-danger-500/10 to-rose-600/5 border border-danger-500/20 hover:border-danger-500/40 transition-all group"
          id="dashboard-report-lost-btn"
        >
          <div className="w-12 h-12 rounded-xl bg-danger-500/20 flex items-center justify-center group-hover:bg-danger-500/30 transition-colors">
            <PackageSearch size={22} className="text-danger-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Report Lost Item</p>
            <p className="text-xs text-dark-100/50">Upload photos and let AI find it</p>
          </div>
          <ArrowRight size={18} className="text-dark-100/30 group-hover:text-danger-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link to="/report/found"
          className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-br from-success-500/10 to-teal-600/5 border border-success-500/20 hover:border-success-500/40 transition-all group"
          id="dashboard-report-found-btn"
        >
          <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center group-hover:bg-success-500/30 transition-colors">
            <PackagePlus size={22} className="text-success-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Report Found Item</p>
            <p className="text-xs text-dark-100/50">Help reunite owners with belongings</p>
          </div>
          <ArrowRight size={18} className="text-dark-100/30 group-hover:text-success-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Pending Matches – Wide */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2">
                <Zap size={18} className="text-primary-400" />
                AI Matches
                {totalMatches > 0 && (
                  <span className="badge badge-primary text-xs">{totalMatches} pending</span>
                )}
              </h2>
              <Link to="/matches" className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {matchesLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : matchesData?.matches?.length ? (
              <div className="space-y-2">
                {matchesData.matches.map(match => (
                  <Link key={match._id} to={`/matches/${match._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex gap-1 shrink-0">
                      <img src={match.lostItem?.images?.[0]?.url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <img src={match.foundItem?.images?.[0]?.url} alt="" className="w-10 h-10 rounded-lg object-cover -ml-4 ring-2 ring-dark-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{match.lostItem?.title}</p>
                      <p className="text-xs text-dark-100/50">vs {match.foundItem?.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary-400">
                        {Math.round(match.similarityScore * 100)}%
                      </p>
                      <Badge variant={match.confidence === 'very_high' ? 'success' : 'primary'} className="text-[10px]">
                        {match.confidence}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Zap}
                title="No matches yet"
                description="Report your lost items and AI will automatically find matches"
                action={<Link to="/report/lost" className="btn btn-primary btn-sm">Report Lost Item</Link>}
              />
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* My Lost Items */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <PackageSearch size={16} className="text-danger-400" />
                My Lost Items
              </h2>
              <Link to="/report/lost" className="btn btn-ghost btn-icon btn-sm">
                <Plus size={16} />
              </Link>
            </div>
            {lostLoading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : lostData?.items?.length ? (
              <div className="-mx-3">
                {lostData.items.slice(0, 3).map(item => <ItemCardMini key={item._id} item={item} type="lost" />)}
              </div>
            ) : (
              <p className="text-dark-100/40 text-xs text-center py-4">No lost items reported</p>
            )}
          </Card>

          {/* My Found Items */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <PackagePlus size={16} className="text-success-400" />
                Found Reports
              </h2>
              <Link to="/report/found" className="btn btn-ghost btn-icon btn-sm">
                <Plus size={16} />
              </Link>
            </div>
            {foundLoading ? (
              <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14" />)}</div>
            ) : foundData?.items?.length ? (
              <div className="-mx-3">
                {foundData.items.slice(0, 3).map(item => <ItemCardMini key={item._id} item={item} type="found" />)}
              </div>
            ) : (
              <p className="text-dark-100/40 text-xs text-center py-4">No found items reported</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
