/**
 * FindIt – React App Entry Point
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

// ─── React Query Client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:              1,
      staleTime:          1000 * 60 * 2,       // 2 minutes
      gcTime:             1000 * 60 * 10,       // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background:  '#1e293b',
              color:       '#e2e8f0',
              border:      '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily:  'Inter, sans-serif',
              fontSize:    '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#0f172a' },
            },
          }}
        />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </QueryClientProvider>
)
