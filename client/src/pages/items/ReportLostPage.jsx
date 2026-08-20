/**
 * Report Lost Item – Multi-Step Form
 * Step 1: Basic info | Step 2: Location | Step 3: Images & Reward
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  PackageSearch, MapPin, Image as ImageIcon, ChevronRight,
  ChevronLeft, Upload, X, Gift, Calendar, Clock,
  CheckCircle, Loader2, Locate,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Input, Textarea, Select, Button } from '../../components/ui'
import { lostItemService } from '../../services'
import { useDocumentTitle } from '../../hooks/index'
import { ITEM_CATEGORIES, ITEM_COLORS } from '../../utils/constants'

// Fix Leaflet icon in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Map Click Handler ────────────────────────────────────────────────────────
const MapClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

// NOTE: MapLifecycle with map.remove() was intentionally removed.
// Calling map.remove() manually caused the "Map container is already initialized"
// crash on step back/forward navigation. React-Leaflet v4 manages its own
// teardown internally; we instead use a changing `key` on <MapContainer>
// to force a fresh DOM node (and fresh Leaflet instance) on each mount.

const MapController = ({ centerMapLocation }) => {
  const map = useMapEvents({})
  useEffect(() => {
    if (centerMapLocation) {
      map.setView([centerMapLocation.lat, centerMapLocation.lng], 14)
    }
  }, [centerMapLocation, map])
  return null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = ['Details', 'Location', 'Images & Reward']

const step1Schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Please select a category'),
  brand: z.string().optional(),
  color: z.string().optional(),
  description: z.string().min(10, 'Please provide a description (min 10 chars)'),
  lostDate: z.string().min(1, 'Please select the date you lost this item'),
  lostTime: z.string().optional(),
})

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

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportLostPage() {
  useDocumentTitle('Report Lost Item')
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState([])        // File objects with preview
  const [location, setLocation] = useState(null)       // { lat, lng }
  const [address, setAddress] = useState('')
  const [reward, setReward] = useState({ offered: false, amount: '', currency: 'USD' })
  // Incremented each time the location step is entered so <MapContainer> gets
  // a new key → new DOM node → no "Map container is already initialized" error.
  const mapKeyRef = useRef(0)
  
  const [isLocating, setIsLocating] = useState(false)
  const [centerMapLocation, setCenterMapLocation] = useState(null)

  const { register, handleSubmit, trigger, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(step1Schema),
  })

  // ─── Image Dropzone ─────────────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2),
    }))
    setImages(prev => [...prev, ...newImages].slice(0, 5))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024,
  })

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const handleLocationSelect = async ({ lat, lng }) => {
    setLocation({ lat, lng })
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      const data = await res.json()
      setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch {
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
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

  // ─── Step Navigation ─────────────────────────────────────────────────────────
  const goNext = async () => {
    if (step === 0) {
      const valid = await trigger()
      if (!valid) return
    }
    if (step === 1 && !location) {
      toast.error('Please select a location on the map.')
      return
    }

    setStep(s => s + 1)
  }

  // Bump the map key every time we navigate TO the location step (step 1) so
  // React unmounts the old MapContainer DOM node and mounts a fresh one.
  const goBack = () => {
    setStep(s => {
      const next = s - 1
      if (next === 1) mapKeyRef.current += 1
      return next
    })
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!images.length) { toast.error('Please upload at least one image.'); return }
    if (!location) { toast.error('Please select a location.'); return }

    setLoading(true)
    try {
      const formData = new FormData()

      // Core fields
      Object.entries(data).forEach(([k, v]) => v && formData.append(k, v))

      // Location
      formData.append('locationLat', location.lat)
      formData.append('locationLng', location.lng)
      formData.append('locationAddress', address)

      // Reward
      formData.append('rewardOffered', reward.offered)
      formData.append('rewardAmount', reward.amount || 0)
      formData.append('rewardCurrency', reward.currency)

      // Images
      images.forEach(img => formData.append('images', img.file))

      const { data: res } = await lostItemService.create(formData)
      toast.success('Lost item reported! AI matching started.')
      navigate(`/items/lost/${res.data._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to report item.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
          <PackageSearch size={24} className="text-danger-400" />
          Report Lost Item
        </h1>
        <p className="text-dark-100/50 text-sm">Provide details to help AI find your item faster.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < step ? 'bg-primary-600 text-white' :
              i === step ? 'bg-primary-600 text-white ring-2 ring-primary-500/40 ring-offset-2 ring-offset-dark-900' :
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

          {/* ─── Step 0: Basic Details ─────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-5">
              <Input label="Item Title *" placeholder="e.g. Black AirPods Pro Case"
                error={errors.title?.message} id="lost-title" {...register('title')} />

              <div className="grid grid-cols-2 gap-4">
                <Select label="Category *" error={errors.category?.message} id="lost-category" {...register('category')}>
                  <option value="">Select category...</option>
                  {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Input label="Color" placeholder="e.g. Black, Silver"
                  error={errors.color?.message} id="lost-color" {...register('color')} />
              </div>

              <Input label="Brand / Model" placeholder="e.g. Apple, Samsung Galaxy S24"
                error={errors.brand?.message} id="lost-brand" {...register('brand')} />

              <Textarea label="Description *" placeholder="Describe identifying features, serial number, what was inside..."
                rows={4} error={errors.description?.message} id="lost-description" {...register('description')} />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Date Lost *" type="date" error={errors.lostDate?.message}
                  id="lost-date" max={new Date().toISOString().split('T')[0]} {...register('lostDate')} />
                <Input label="Approximate Time" type="time" id="lost-time" {...register('lostTime')} />
              </div>
            </motion.div>
          )}

          {/* ─── Step 1: Location ──────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-dark-100/50">
                  <MapPin size={16} className="text-primary-400" />
                  Click on the map to mark where you lost the item
                </div>
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

              <div className="map-container rounded-2xl overflow-hidden" style={{ height: '360px' }}>
                <SafeMapWrapper>
                  <MapContainer
                    key={mapKeyRef.current}
                    center={location ? [location.lat, location.lng] : [20, 0]}
                    zoom={location ? 14 : 2}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com">CARTO</a>'
                    />
                    <MapClickHandler onLocationSelect={handleLocationSelect} />
                    <MapController centerMapLocation={centerMapLocation} />
                    {location && <Marker position={[location.lat, location.lng]} />}
                  </MapContainer>
                </SafeMapWrapper>
              </div>

              {location ? (
                <div className="glass rounded-xl p-3 text-sm">
                  <p className="text-dark-100/50 text-xs mb-1">Selected Location</p>
                  <p className="text-dark-100 font-medium">{address}</p>
                  <p className="text-dark-100/40 text-xs mt-1">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                </div>
              ) : (
                <div className="glass rounded-xl p-3 text-sm text-dark-100/40 text-center">
                  No location selected. Click on the map above.
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Step 2: Images & Reward ────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6">

              {/* Image Upload */}
              <div>
                <label className="label">Photos * (up to 5)</label>
                <div {...getRootProps()} className={`drop-zone ${isDragActive ? 'drag-over' : ''}`}>
                  <input {...getInputProps()} id="lost-images" />
                  <Upload size={32} className="text-dark-100/30 mx-auto mb-3" />
                  <p className="text-sm text-dark-100/60">
                    {isDragActive ? 'Drop your images here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-dark-100/30 mt-1">JPG, PNG, WebP · Max 10MB each</p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative group aspect-square">
                        <img src={img.preview} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-dark-900/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} className="text-white" />
                        </button>
                        {img === images[0] && (
                          <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-primary-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                            COVER
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reward */}
              <div className="glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Gift size={18} className="text-warning-400" />
                    <span className="font-semibold text-sm">Offer a Reward</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setReward(r => ({ ...r, offered: !r.offered }))}
                    className={`w-10 h-5 rounded-full transition-colors ${reward.offered ? 'bg-primary-600' : 'bg-white/10'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${reward.offered ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {reward.offered && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="label">Amount</label>
                      <input type="number" min="0" placeholder="100"
                        value={reward.amount}
                        onChange={e => setReward(r => ({ ...r, amount: e.target.value }))}
                        className="input" id="lost-reward-amount"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="label">Currency</label>
                      <select value={reward.currency}
                        onChange={e => setReward(r => ({ ...r, currency: e.target.value }))}
                        className="input select" id="lost-reward-currency">
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <Button type="button" variant="secondary" onClick={goBack}
              icon={<ChevronLeft size={16} />}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext} iconRight={<ChevronRight size={16} />}>
              Continue
            </Button>
          ) : (
            <Button type="submit" loading={loading} className="btn-lg px-8" id="lost-submit-btn">
              {loading ? 'Submitting...' : 'Submit Report'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
