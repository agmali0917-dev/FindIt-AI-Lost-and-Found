/**
 * Match Detail Page – View match details, confirm/reject, access chat
 */
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Zap, CheckCircle, XCircle, MessageCircle, ArrowLeft, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { matchService } from '../services'
import { Badge, Card, ConfidenceMeter, Avatar, Skeleton, Modal } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useDocumentTitle } from '../hooks/index'
import { useState } from 'react'

export default function MatchDetail() {
  useDocumentTitle('Match Details')
  const { id }       = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const [showReject, setShowReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn:  () => matchService.getById(id),
    select:   d => d.data.data,
  })

  const confirmMutation = useMutation({
    mutationFn: () => matchService.confirm(id),
    onSuccess: (res) => {
      toast.success('Match confirmed! Chat started.')
      queryClient.invalidateQueries({ queryKey: ['match', id] })
      navigate(`/chats/${res.data.data.chatId}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to confirm match.'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => matchService.reject(id, { reason: rejectReason }),
    onSuccess: () => {
      toast.success('Match rejected.')
      queryClient.invalidateQueries({ queryKey: ['match', id] })
      setShowReject(false)
    },
  })

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
  if (!data) return <div className="p-6 text-center text-dark-100/50">Match not found</div>

  const isLostOwner = user?._id === data.lostItemOwner?._id

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-100/50 hover:text-dark-100 mb-6 text-sm">
        <ArrowLeft size={16} /> Back to Matches
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center">
          <Zap size={22} className="text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-black">AI Match Found</h1>
          <Badge variant={data.status === 'pending' ? 'warning' : data.status === 'confirmed' ? 'success' : 'danger'}>
            {data.status}
          </Badge>
        </div>
      </div>

      {/* Confidence */}
      <Card className="mb-4">
        <ConfidenceMeter score={data.similarityScore} label={`AI Confidence Score – ${Math.round(data.similarityScore * 100)}%`} />
        <p className="text-xs text-dark-100/40 mt-2 text-center">
          Based on CLIP vision AI image + text analysis
        </p>
      </Card>

      {/* Items Comparison */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Lost Item */}
        <Card>
          <p className="text-xs font-bold text-danger-400 mb-3">🔴 LOST ITEM</p>
          <Link to={`/items/lost/${data.lostItem?._id}`}>
            <img src={data.lostItem?.images?.[0]?.url} alt="" className="w-full aspect-video object-cover rounded-xl mb-3" />
            <h3 className="font-bold text-sm">{data.lostItem?.title}</h3>
            <p className="text-xs text-dark-100/50">{data.lostItem?.category} · {data.lostItem?.location?.city}</p>
          </Link>
        </Card>

        {/* Found Item */}
        <Card>
          <p className="text-xs font-bold text-success-400 mb-3">🟢 FOUND ITEM</p>
          <Link to={`/items/found/${data.foundItem?._id}`}>
            <img src={data.foundItem?.images?.[0]?.url} alt="" className="w-full aspect-video object-cover rounded-xl mb-3" />
            <h3 className="font-bold text-sm">{data.foundItem?.title}</h3>
            <p className="text-xs text-dark-100/50">{data.foundItem?.category} · {data.foundItem?.location?.city}</p>
          </Link>
        </Card>
      </div>

      {/* Parties */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <p className="text-xs text-dark-100/40 mb-2">Lost Item Owner</p>
          <div className="flex items-center gap-3">
            <Avatar src={data.lostItemOwner?.avatar?.url} name={data.lostItemOwner?.name} size="sm" />
            <span className="font-semibold text-sm">{data.lostItemOwner?.name}</span>
          </div>
        </Card>
        <Card>
          <p className="text-xs text-dark-100/40 mb-2">Found Item Reporter</p>
          <div className="flex items-center gap-3">
            <Avatar src={data.foundItemOwner?.avatar?.url} name={data.foundItemOwner?.name} size="sm" />
            <span className="font-semibold text-sm">{data.foundItemOwner?.name}</span>
          </div>
        </Card>
      </div>

      {/* Actions */}
      {data.status === 'pending' && isLostOwner && (
        <div className="flex gap-3">
          <button onClick={() => confirmMutation.mutate()} disabled={confirmMutation.isPending}
            className="btn btn-primary flex-1 btn-lg gap-2">
            <CheckCircle size={18} />
            {confirmMutation.isPending ? 'Confirming...' : 'Confirm & Start Chat'}
          </button>
          <button onClick={() => setShowReject(true)} className="btn btn-secondary gap-2">
            <XCircle size={18} /> Not a Match
          </button>
        </div>
      )}

      {data.status === 'confirmed' && data.chat && (
        <Link to={`/chats/${data.chat}`} className="btn btn-accent w-full btn-lg gap-2">
          <MessageCircle size={18} /> Open Chat
        </Link>
      )}

      {data.status === 'pending' && !isLostOwner && (
        <div className="flex items-center gap-3 p-4 glass rounded-2xl">
          <Clock size={18} className="text-warning-400" />
          <p className="text-sm text-dark-100/60">
            Waiting for the lost item owner to review this match.
          </p>
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={showReject} onClose={() => setShowReject(false)} title="Reject Match" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-dark-100/60">Why isn't this a match? (optional)</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
            placeholder="Different item, wrong color, etc."
            rows={3} className="input resize-none" />
          <div className="flex gap-3">
            <button onClick={() => setShowReject(false)} className="btn btn-secondary flex-1">Cancel</button>
            <button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}
              className="btn btn-danger flex-1">
              {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
