/**
 * Search Page – Full-text + filters + map view
 */

import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search, SlidersHorizontal, Grid, List, MapPin,
  X, ChevronDown, Filter,
} from 'lucide-react'
import { searchService } from '../services'
import { Badge, Skeleton, EmptyState } from '../components/ui'
import { ITEM_CATEGORIES, ITEM_COLORS } from '../utils/constants'
import { useDocumentTitle, useDebounce } from '../hooks/index'
import { formatDistanceToNow } from 'date-fns'
import InfiniteScroll from 'react-infinite-scroll-component'

// ─── Item Card ────────────────────────────────────────────────────────────────
const ItemCard = ({ item, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -3 }}
    className="card card-hover group"
  >
    <Link to={`/items/${type}/${item._id}`}>
      <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-dark-800 relative">
        <img
          src={item.images?.[0]?.url}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge variant={type === 'lost' ? 'danger' : 'success'}>
            {type === 'lost' ? '🔴 Lost' : '🟢 Found'}
          </Badge>
          {item.isVerified && <Badge variant="accent">✓ Verified</Badge>}
        </div>
        {item.reward?.offered && (
          <div className="absolute top-2 right-2">
            <Badge variant="warning">💰 Reward</Badge>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-sm leading-snug group-hover:text-primary-300 transition-colors line-clamp-2">
          {item.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="primary">{item.category}</Badge>
          {item.color && <span className="text-xs text-dark-100/50">{item.color}</span>}
        </div>
        {item.location?.city && (
          <p className="text-xs text-dark-100/40 flex items-center gap-1">
            <MapPin size={10} />
            {item.location.city}, {item.location.country || ''}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <img
              src={item.reportedBy?.avatarUrl || item.reportedBy?.avatar?.url}
              alt={item.reportedBy?.name}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs text-dark-100/40">{item.reportedBy?.name}</span>
          </div>
          <span className="text-xs text-dark-100/30">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
    </Link>
  </motion.div>
)

// ─── Search Page ──────────────────────────────────────────────────────────────
export default function SearchPage() {
  useDocumentTitle('Search Items')
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || '',
    color: searchParams.get('color') || '',
    city: searchParams.get('city') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  })

  const debouncedQ = useDebounce(filters.q, 400)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQ, filters.type, filters.category, filters.color, filters.startDate, filters.endDate],
    queryFn: () => searchService.search({
      q: debouncedQ,
      type: filters.type,
      category: filters.category,
      color: filters.color,
      city: filters.city,
      startDate: filters.startDate,
      endDate: filters.endDate,
    }),
    select: d => d.data.data,
  })

  const updateFilter = (key, value) => {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    const params = new URLSearchParams()
    Object.entries(updated).forEach(([k, v]) => v && params.set(k, v))
    setSearchParams(params)
  }

  const clearFilters = () => {
    const reset = { q: '', type: 'all', category: '', color: '', startDate: '', endDate: '' }
    setFilters(reset)
    setSearchParams({})
  }

  const allItems = [
    ...(data?.results?.lost || []).map(i => ({ ...i, _type: 'lost' })),
    ...(data?.results?.found || []).map(i => ({ ...i, _type: 'found' })),
  ]

  const hasActiveFilters = filters.category || filters.color || filters.startDate || filters.endDate

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-xl font-black mb-4">Search Items</h1>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-100/40" />
          <input
            type="search"
            value={filters.q}
            onChange={e => updateFilter('q', e.target.value)}
            placeholder="Search for lost or found items..."
            className="input pl-11 pr-4 text-base h-12"
            id="search-input"
          />
          {filters.q && (
            <button onClick={() => updateFilter('q', '')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-100/40 hover:text-dark-100">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Type Tabs */}
        <div className="flex bg-white/5 rounded-xl p-1 gap-1">
          {['all', 'lost', 'found'].map(t => (
            <button key={t} onClick={() => updateFilter('type', t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${filters.type === t ? 'bg-primary-600 text-white' : 'text-dark-100/50 hover:text-dark-100'
                }`} id={`search-type-${t}`}>
              {t === 'all' ? 'All Items' : t === 'lost' ? '🔴 Lost' : '🟢 Found'}
            </button>
          ))}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn btn-secondary btn-sm gap-2 ${hasActiveFilters ? 'border-primary-500 text-primary-300' : ''}`}
          id="search-filter-btn"
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasActiveFilters && <span className="badge badge-primary text-[10px] py-0 px-1">!</span>}
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-danger-400 hover:text-danger-300 flex items-center gap-1">
            <X size={12} /> Clear filters
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-dark-100/40">
            {data?.total || 0} results
            {isFetching && !isLoading && ' · Refreshing...'}
          </span>
          <button onClick={() => setViewMode('grid')}
            className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'grid' ? 'text-white' : 'text-dark-100/40'}`}>
            <Grid size={16} />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'list' ? 'text-white' : 'text-dark-100/40'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="glass rounded-2xl p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="label">Category</label>
            <select value={filters.category} onChange={e => updateFilter('category', e.target.value)}
              className="input select text-sm" id="search-category">
              <option value="">All Categories</option>
              {ITEM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Color</label>
            <select value={filters.color} onChange={e => updateFilter('color', e.target.value)}
              className="input select text-sm" id="search-color">
              <option value="">Any Color</option>
              {ITEM_COLORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">City</label>
            <input type="text" value={filters.city} onChange={e => updateFilter('city', e.target.value)}
              placeholder="e.g. New York"
              className="input text-sm" id="search-city" />
          </div>
          <div>
            <label className="label">From Date</label>
            <input type="date" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)}
              className="input text-sm" id="search-start-date" />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)}
              className="input text-sm" id="search-end-date" />
          </div>
        </motion.div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : allItems.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={filters.q ? `No items found for "${filters.q}"` : 'No items match your current filters.'}
          action={<button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear Filters</button>}
        />
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-4`}>
          {allItems.map(item => <ItemCard key={`${item._type}-${item._id}`} item={item} type={item._type} />)}
        </div>
      )}
    </div>
  )
}
