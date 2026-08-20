/**
 * Custom React Hooks
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ─── useDebounce ──────────────────────────────────────────────────────────────
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

// ─── useLocalStorage ─────────────────────────────────────────────────────────
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) { console.error(error) }
  }

  return [storedValue, setValue]
}

// ─── useClickOutside ─────────────────────────────────────────────────────────
export const useClickOutside = (handler) => {
  const ref = useRef(null)
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) return
      handler(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [handler])
  return ref
}

// ─── useIntersectionObserver ──────────────────────────────────────────────────
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, { threshold: 0.1, ...options })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, isIntersecting]
}

// ─── useDocumentTitle ─────────────────────────────────────────────────────────
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | FindIt` : 'FindIt – AI Powered Lost & Found'
    return () => { document.title = 'FindIt – AI Powered Lost & Found' }
  }, [title])
}

// ─── useGeolocation ───────────────────────────────────────────────────────────
export const useGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  return { location, error, loading, getLocation }
}

// ─── useWindowSize ────────────────────────────────────────────────────────────
export const useWindowSize = () => {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return size
}
