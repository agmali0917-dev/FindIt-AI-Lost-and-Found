/**
 * Report Found Item – Similar to ReportLost but triggers AI matching
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  PackagePlus, MapPin, Upload, X, ChevronRight,
  ChevronLeft, Zap, CheckCircle, Loader2, Locate,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Input, Textarea, Select, Button } from '../../components/ui'
import { foundItemService } from '../../services'
import { useDocumentTitle } from '../../hooks/index'
import { ITEM_CATEGORIES } from '../../utils/constants'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({ click(e) { onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng }) } })
  return null
}

const STEPS = ['Item Details', 'Location', 'Photos']

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  category: z.string().min(1, 'Category required'),
  brand: z.string().optional(),
  color: z.string().optional(),
  description: z.string().min(10, 'Description required'),
  foundDate: z.string().min(1, 'Date required'),
  handoverLocation: z.string().optional(),
  contactPreference: z.string().default('chat'),
})

const MapController = ({ centerMapLocation }) => {
  const map = useMapEvents({})
  useEffect(() => {
    if (centerMapLocation) {
      map.setView([centerMapLocation.lat, centerMapLocation.lng], 14)
    }
  }, [centerMapLocation, map])
  return null
}

// ─── Safe Map Wrapper ─────────────────────────────────────────────────────────
// Fixes React 18 StrictMode and AnimatePresence double-mount DOM node reuse bug
const SafeMapWrapper = ({ children }) => {
  const wrapperRef = useRef(null)

  useEffect(() => {
    return () => {
      if (wrapperRef.current) {
        // Remove Leaflet's internal initialization flag on React unmount so 
        // a subsequent StrictMode or AnimatePresence remount succeeds.
        const leafletContainer = wrapperRef.current.querySelector('.leaflet-container')
        if (leafletContainer) {
          leafletContainer._leaflet_id = null
        }
      }
    }
  }, [])

  return <div ref={wrapperRef} style={{ height: '100%', width: '100%' }}>{children}</div>
}

export default function ReportFoundPage() {
  useDocumentTitle('Report Found Item')
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])
  const [location, setLocation] = useState(null)
  const [address, setAddress] = useState('')
  const [isLocating, setIsLocating] = useState(false)
  const [centerMapLocation, setCenterMapLocation] = useState(null)

  const { register, handleSubmit, trigger, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onDrop = useCallback((files) => {
    const imgs = files.map(f => ({ file: f, preview: URL.createObjectURL(f), id: Math.random().toString(36).slice(2) }))
    setImages(prev => [...prev, ...imgs].slice(0, 5))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 5, maxSize: 10 * 1024 * 1024,
  })

  const handleLocationSelect = async ({ lat, lng }) => {
    setLocation({ lat, lng })
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch { setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`) }
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
        handleLocationSelect(coords)
        setCenterMapLocation(coords)
        setIsLocating(false)
      },
      (error) => {
        setIsLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Please allow location access.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          toast.error('Location information is unavailable.')
        } else if (error.code === error.TIMEOUT) {
          toast.error('The request to get user location timed out.')
        } else {
          toast.error('An unknown error occurred getting location.')
        }
      },
      { timeout: 10000 }
    )
  }

  const goNext = async () => {
    if (step === 0 && !(await trigger())) return
    if (step === 1 && !location) { toast.error('Please select a location'); return }
    setStep(s => s + 1)
  }

  const onSubmit = async (data) => {
    if (!images.length) { toast.error('Please upload at least one image'); return }
    if (!location) { toast.error('Please select a location'); return }

    setLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => v && formData.append(k, v))
      formData.append('locationLat', location.lat)
      formData.append('locationLng', location.lng)
      formData.append('locationAddress', address)
      images.forEach(img => formData.append('images', img.file))

      const { data: res } = await foundItemService.create(formData)
      toast.success('Found item reported! AI matching started 🤖')
      navigate(`/items/found/${res.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <PackagePlus size={24} className="text-success-400" />
          Report Found Item
        </h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-accent-400">
          <Zap size={14} />
          AI will automatically match this with lost items
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-success-600 text-white' :
              i === step ? 'bg-success-600 text-white ring-2 ring-success-500/40 ring-offset-2 ring-offset-dark-900' :
                'bg-white/5 text-dark-100/40'
              }`}>
              {i < step ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-white' : 'text-dark-100/40'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-white/5 mx-1 min-w-[20px]" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-5">
              <Input label="Item Title *" placeholder="e.g. Found black wallet near park"
                error={errors.title?.message} id="found-title" {...register('title')} />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Category *" error={errors.category?.message} id="found-category" {...register('category')}>
                  <option value="">Select...</option>
                  {ITEM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </Select>
                <Input label="Color" placeholder="Black, Silver..." id="found-color" {...register('color')} />
              </div>
              <Input label="Brand / Model" placeholder="Apple, Samsung..." id="found-brand" {...register('brand')} />
              <Textarea label="Description *" placeholder="What did you find? Describe it in detail..."
                rows={4} error={errors.description?.message} id="found-description" {...register('description')} />
              <Input label="Date Found *" type="date" error={errors.foundDate?.message}
                id="found-date" max={new Date().toISOString().split('T')[0]} {...register('foundDate')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Handover Location" placeholder="Where can owner collect?"
                  id="found-handover" {...register('handoverLocation')} />
                <Select label="Contact Preference" id="found-contact" {...register('contactPreference')}>
                  <option value="chat">Chat</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </Select>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-dark-100/50 flex items-center gap-2">
                  <MapPin size={16} className="text-success-400" />
                  Click to mark where you found the item
                </p>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleCurrentLocation}
                  disabled={isLocating}
                  icon={isLocating ? <Loader2 size={14} className="animate-spin" /> : <Locate size={14} />}
                >
                  {isLocating ? 'Locating...' : 'Use Current Location'}
                </Button>
              </div>
              <div style={{ height: '360px' }} className="map-container rounded-2xl overflow-hidden">
                <SafeMapWrapper>
                  <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    <MapController centerMapLocation={centerMapLocation} />
                    {location && <Marker position={[location.lat, location.lng]} />}
                  </MapContainer>
                </SafeMapWrapper>
              </div>
              {location ? (
                <div className="glass rounded-xl p-3 text-sm">
                  <p className="text-dark-100/50 text-xs mb-1">Found Location</p>
                  <p className="font-medium">{address}</p>
                </div>
              ) : (
                <div className="glass rounded-xl p-3 text-sm text-dark-100/40 text-center">Click the map to set location</div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-5">
              <div>
                <label className="label">Photos * (up to 5) – <span className="text-accent-400">better photos = better AI matching</span></label>
                <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'drag-over' : ''}`}>
                  <input {...getInputProps()} id="found-images" />
                  <Upload size={32} className="text-dark-100/30 mx-auto mb-3" />
                  <p className="text-sm text-dark-100/60">Drag & drop or click to upload photos</p>
                  <p className="text-xs text-dark-100/30 mt-1">Clear, well-lit photos help AI match more accurately</p>
                </div>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {images.map(img => (
                      <div key={img.id} className="relative group aspect-square">
                        <img src={img.preview} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button type="button" onClick={() => setImages(p => p.filter(i => i.id !== img.id))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-dark-900/80 rounded-full items-center justify-center hidden group-hover:flex">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center">
                    <Zap size={18} className="text-accent-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">AI Matching will start automatically</p>
                    <p className="text-xs text-dark-100/50">
                      After submitting, our CLIP AI will compare your photos with all active lost item reports.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={() => setStep(s => s - 1)} icon={<ChevronLeft size={16} />}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} iconRight={<ChevronRight size={16} />}>Continue</Button>
          ) : (
            <Button type="submit" loading={loading} className="btn-lg px-8" id="found-submit-btn">
              Submit & Start AI Matching
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
