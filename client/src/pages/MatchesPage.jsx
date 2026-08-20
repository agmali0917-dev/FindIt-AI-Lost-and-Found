/**
 * Matches Page – List of AI-detected matches
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Zap, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import { matchService } from '../services'
import { Badge, EmptyState, Skeleton, ConfidenceMeter, Card } from '../components/ui'
import { useDocumentTitle } from '../hooks/index'
import { formatDistanceToNow } from 'date-fns'

const STATUS_CONFIG = {
  pending:   { icon: Clock,         color: 'warning', label: 'Pending Review' },
  confirmed: { icon: CheckCircle,   color: 'success', label: 'Confirmed' },
  rejected:  { icon: XCircle,       color: 'danger',  label: 'Rejected' },
  returned:  { icon: CheckCircle,   color: 'accent',  label: 'Returned' },
}

const MatchCard = ({ match }) => {
  const config = STATUS_CONFIG[match.status] || STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }} className="card card-hover">
      <Link to={`/matches/${match._id}`} className="block">
        <div className="flex items-start gap-4 mb-4">
          {/* Item images side by side */}
          <div className="flex shrink-0">
            <img src={match.lostItem?.images?.[0]?.url} alt="Lost"
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-danger-500/30" />
            <img src={match.foundItem?.images?.[0]?.url} alt="Found"
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-success-500/30 -ml-4 z-10 relative" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={config.color}>
                <Icon size={12} />
                {config.label}
              </Badge>
            </div>
            <p className="text-sm font-bold truncate">{match.lostItem?.title}</p>
            <p className="text-xs text-dark-100/40">matched with</p>
            <p className="text-sm font-semibold truncate text-dark-100/70">{match.foundItem?.title}</p>
          </div>

          <ArrowRight size={16} className="text-dark-100/30 shrink-0 mt-1" />
        </div>

        <ConfidenceMeter score={match.similarityScore} label="AI Confidence" />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-dark-100/40">
            <Zap size={12} className="text-primary-400" />
            {match.lostItem?.category}
          </div>
          <span className="text-xs text-dark-100/30">
            {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

export default function MatchesPage() {
  useDocumentTitle('AI Matches')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['matches', statusFilter],
    queryFn:  () => matchService.getAll({ status: statusFilter, limit: 20 }),
    select:   d => d.data.data,
  })

  const matches   = data?.matches || []
  const statuses  = ['', 'pending', 'confirmed', 'rejected', 'returned']

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <Zap size={24} className="text-primary-400" /> AI Matches
        </h1>
        <p className="text-dark-100/50 text-sm">Items our AI thinks might match yours</p>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn btn-sm capitalize whitespace-nowrap ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s || 'All Matches'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState icon={Zap} title="No matches found"
          description="Report lost items and our AI will automatically find matches when found items are reported."
          action={<Link to="/report/lost" className="btn btn-primary btn-sm">Report Lost Item</Link>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {matches.map(match => <MatchCard key={match._id} match={match} />)}
        </div>
      )}
    </div>
  )
}
