/**
 * Lost Item Detail Page
 * Shows item images, map, QR code, matches, owner info
 */

import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MapPin, Calendar, Tag, Gift, QrCode, Edit2, Trash2,
  Eye, Share2, ArrowLeft, CheckCircle, Clock, Zap,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { format } from 'date-fns'
import { lostItemService } from '../../services'
import { Badge, Avatar, Card, ConfidenceMeter, Modal, Skeleton } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { ITEM_STATUS_COLORS } from '../../utils/constants'
import { useDocumentTitle } from '../../hooks/index'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function LostItemDetail() {
  const { id }          = useParams()
  const { user }        = useAuth()
  const navigate        = useNavigate()
  const queryClient     = useQueryClient()

  const [selectedImage, setSelectedImage] = useState(0)
  const [showQR,        setShowQR]        = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['lostItem', id],
    queryFn:  () => lostItemService.getById(id),
    select:   d => d.data.data,
  })

  useDocumentTitle(data?.title || 'Lost Item')

  const deleteMutation = useMutation({
    mutationFn: () => lostItemService.delete(id),
    onSuccess: () => {
      toast.success('Item deleted')
      navigate('/dashboard')
    },
    onError: () => toast.error('Delete failed'),
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
        </div>
      </div>
    )
  }

  if (!data) return <div className="p-6 text-center text-dark-100/50">Item not found</div>

  const isOwner = user?._id === data.reportedBy?._id || user?._id === data.reportedBy

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-100/50 hover:text-dark-100 mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Images */}
        <div className="lg:col-span-3 space-y-3">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-dark-800">
            <img src={data.images?.[selectedImage]?.url} alt={data.title}
              className="w-full h-full object-contain" />
          </div>
          {data.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {data.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden ring-2 transition-all ${
                    i === selectedImage ? 'ring-primary-500' : 'ring-white/10'
                  }`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Map */}
          {data.location?.coordinates && (
            <Card>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-primary-400" /> Lost Location
              </h3>
              <div style={{ height: '200px' }} className="map-container rounded-xl overflow-hidden">
                <MapContainer
                  center={[data.location.coordinates[1], data.location.coordinates[0]]}
                  zoom={14}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Marker position={[data.location.coordinates[1], data.location.coordinates[0]]} />
                </MapContainer>
              </div>
              <p className="text-xs text-dark-100/40 mt-2">{data.location.address}</p>
            </Card>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="danger">🔴 Lost</Badge>
              <Badge variant={ITEM_STATUS_COLORS[data.status] || 'primary'}>{data.status}</Badge>
              {data.isVerified && <Badge variant="accent">✓ Verified</Badge>}
            </div>
            <h1 className="text-xl font-black mb-1">{data.title}</h1>
            <div className="flex items-center gap-3 text-xs text-dark-100/40">
              <span className="flex items-center gap-1"><Eye size={12} /> {data.views} views</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} /> Lost {format(new Date(data.lostDate), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{data.category}</Badge>
            {data.brand && <Badge variant="accent">{data.brand}</Badge>}
            {data.color && <span className="badge badge-primary">{data.color}</span>}
          </div>

          {/* Description */}
          <Card>
            <p className="text-sm text-dark-100/70 leading-relaxed">{data.description}</p>
          </Card>

          {/* Reward */}
          {data.reward?.offered && (
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning-500/10 flex items-center justify-center">
                  <Gift size={18} className="text-warning-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">Reward Offered</p>
                  <p className="text-warning-400 font-black text-lg">
                    {data.reward.currency} {data.reward.amount}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Owner */}
          <Card>
            <p className="text-xs text-dark-100/40 mb-3">Reported by</p>
            <Link to={`/profile/${data.reportedBy?._id}`} className="flex items-center gap-3 group">
              <Avatar src={data.reportedBy?.avatar?.url} name={data.reportedBy?.name} size="md" />
              <div>
                <p className="font-semibold text-sm group-hover:text-primary-300 transition-colors">
                  {data.reportedBy?.name}
                </p>
                <p className="text-xs text-dark-100/40">
                  {data.reportedBy?.stats?.successfulMatches || 0} successful matches
                </p>
              </div>
            </Link>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button onClick={() => setShowQR(true)} className="btn btn-secondary w-full gap-2">
              <QrCode size={16} /> View QR Code
            </button>
            <button
              onClick={() => navigator.share?.({ title: data.title, url: window.location.href }) ||
                navigator.clipboard.writeText(window.location.href).then(() => toast.success('Link copied!'))}
              className="btn btn-ghost w-full gap-2"
            >
              <Share2 size={16} /> Share
            </button>

            {isOwner && (
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <Link to={`/items/lost/${id}/edit`} className="btn btn-secondary flex-1 gap-2">
                  <Edit2 size={14} /> Edit
                </Link>
                <button onClick={() => setShowDelete(true)} className="btn btn-danger flex-1 gap-2">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Item QR Code" size="sm">
        <div className="text-center">
          <div className="qr-container mx-auto w-fit mb-4">
            {data.qrCode?.dataUrl ? (
              <img src={data.qrCode.dataUrl} alt="QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-dark-900/50">
                <QrCode size={64} />
              </div>
            )}
          </div>
          <p className="text-sm text-dark-100/50 mb-3">Scan to view item details</p>
          <a href={data.qrCode?.dataUrl} download={`findit-${id}.png`} className="btn btn-primary w-full">
            Download QR Code
          </a>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Item?" size="sm">
        <p className="text-dark-100/60 text-sm mb-6">
          This will permanently delete "{data.title}" and all associated matches. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowDelete(false)} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}
            className="btn btn-danger flex-1">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
