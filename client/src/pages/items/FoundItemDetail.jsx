/**
 * Found Item Detail Page (similar to LostItemDetail)
 */
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { MapPin, Calendar, QrCode, Share2, ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { format } from 'date-fns'
import { foundItemService } from '../../services'
import { Badge, Avatar, Card, Modal, Skeleton } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useDocumentTitle } from '../../hooks/index'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export default function FoundItemDetail() {
  const { id }       = useParams()
  const { user }     = useAuth()
  const navigate     = useNavigate()
  const [selImg, setSelImg] = useState(0)
  const [showQR, setShowQR] = useState(false)
  const [showDel, setShowDel] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['foundItem', id],
    queryFn:  () => foundItemService.getById(id),
    select:   d => d.data.data,
  })

  useDocumentTitle(data?.title || 'Found Item')

  const deleteMutation = useMutation({
    mutationFn: () => foundItemService.delete(id),
    onSuccess: () => { toast.success('Item deleted'); navigate('/dashboard') },
  })

  if (isLoading) return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3"><Skeleton className="aspect-square rounded-2xl" /></div>
        <div className="lg:col-span-2 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      </div>
    </div>
  )

  if (!data) return <div className="p-6 text-center text-dark-100/50">Item not found</div>
  const isOwner = user?._id === data.reportedBy?._id

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-100/50 hover:text-dark-100 mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-dark-800">
            <img src={data.images?.[selImg]?.url} alt={data.title} className="w-full h-full object-contain" />
          </div>
          {data.images?.length > 1 && (
            <div className="flex gap-2">
              {data.images.map((img, i) => (
                <button key={i} onClick={() => setSelImg(i)}
                  className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden ring-2 ${i === selImg ? 'ring-success-500' : 'ring-white/10'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {data.location?.coordinates && (
            <Card>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><MapPin size={16} className="text-success-400" /> Found Location</h3>
              <div style={{ height: '180px' }} className="map-container rounded-xl overflow-hidden">
                <MapContainer center={[data.location.coordinates[1], data.location.coordinates[0]]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <Marker position={[data.location.coordinates[1], data.location.coordinates[0]]} />
                </MapContainer>
              </div>
              <p className="text-xs text-dark-100/40 mt-2">{data.location.address}</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="success">🟢 Found</Badge>
              <Badge variant="primary">{data.status}</Badge>
            </div>
            <h1 className="text-xl font-black mb-1">{data.title}</h1>
            <p className="text-xs text-dark-100/40 flex items-center gap-1">
              <Calendar size={12} /> Found {format(new Date(data.foundDate), 'MMM d, yyyy')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="primary">{data.category}</Badge>
            {data.brand && <Badge variant="accent">{data.brand}</Badge>}
            {data.color && <span className="badge badge-primary">{data.color}</span>}
          </div>

          <Card><p className="text-sm text-dark-100/70 leading-relaxed">{data.description}</p></Card>

          {data.handoverLocation && (
            <Card>
              <p className="text-xs text-dark-100/40 mb-1">Handover Location</p>
              <p className="text-sm font-medium">{data.handoverLocation}</p>
            </Card>
          )}

          <Card>
            <p className="text-xs text-dark-100/40 mb-3">Reported by</p>
            <Link to={`/profile/${data.reportedBy?._id}`} className="flex items-center gap-3 group">
              <Avatar src={data.reportedBy?.avatar?.url} name={data.reportedBy?.name} size="md" />
              <div>
                <p className="font-semibold text-sm group-hover:text-primary-300 transition-colors">{data.reportedBy?.name}</p>
                <p className="text-xs text-dark-100/40">Prefers: {data.contactPreference}</p>
              </div>
            </Link>
          </Card>

          {/* AI Status */}
          {data.aiMatchingStatus && (
            <Card>
              <p className="text-xs text-dark-100/40 mb-1">AI Matching Status</p>
              <Badge variant={data.aiMatchingStatus === 'completed' ? 'success' : data.aiMatchingStatus === 'processing' ? 'primary' : 'warning'}>
                {data.aiMatchingStatus}
              </Badge>
            </Card>
          )}

          <div className="flex flex-col gap-2">
            <button onClick={() => setShowQR(true)} className="btn btn-secondary w-full gap-2">
              <QrCode size={16} /> View QR Code
            </button>
            {isOwner && (
              <button onClick={() => setShowDel(true)} className="btn btn-danger w-full gap-2">
                <Trash2 size={14} /> Delete Report
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showQR} onClose={() => setShowQR(false)} title="Item QR Code" size="sm">
        <div className="text-center">
          <div className="qr-container mx-auto w-fit mb-4">
            {data.qrCode?.dataUrl ? <img src={data.qrCode.dataUrl} alt="QR" className="w-48 h-48" /> :
              <div className="w-48 h-48 flex items-center justify-center"><QrCode size={64} className="text-dark-900/30" /></div>}
          </div>
          <a href={data.qrCode?.dataUrl} download={`findit-found-${id}.png`} className="btn btn-primary w-full">Download</a>
        </div>
      </Modal>

      <Modal isOpen={showDel} onClose={() => setShowDel(false)} title="Delete Item?" size="sm">
        <p className="text-dark-100/60 text-sm mb-6">Delete "{data.title}"? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setShowDel(false)} className="btn btn-secondary flex-1">Cancel</button>
          <button onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn btn-danger flex-1">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
