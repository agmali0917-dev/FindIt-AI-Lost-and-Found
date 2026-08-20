/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary – Deep Indigo/Violet
        primary: {
          50:  '#f0f0ff',
          100: '#e0e0ff',
          200: '#c4c4ff',
          300: '#a4a4ff',
          400: '#8080ff',
          500: '#6060f0',
          600: '#4f46e5',  // main
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Accent – Electric Cyan
        accent: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // main
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Success
        success: {
          50:  '#f0fdf4',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        // Warning
        warning: {
          50:  '#fffbeb',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Danger
        danger: {
          50:  '#fff1f2',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        // Dark backgrounds
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080d18',
        },
        // Glass / Surface
        glass: {
          light: 'rgba(255,255,255,0.08)',
          medium: 'rgba(255,255,255,0.12)',
          dark:  'rgba(0,0,0,0.4)',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cal Sans', 'Inter var', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl':  ['3rem',     { lineHeight: '1' }],
        '6xl':  ['3.75rem',  { lineHeight: '1' }],
        '7xl':  ['4.5rem',   { lineHeight: '1' }],
        '8xl':  ['6rem',     { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'glass':  '0 4px 16px 0 rgba(31,38,135,0.37)',
        'glow':   '0 0 20px rgba(99,60,245,0.4)',
        'glow-lg':'0 0 40px rgba(99,60,245,0.3)',
        'glow-accent': '0 0 20px rgba(6,182,212,0.4)',
        'card':   '0 8px 32px rgba(0,0,0,0.15)',
        'card-dark': '0 8px 32px rgba(0,0,0,0.4)',
        'float':  '0 20px 60px rgba(0,0,0,0.2)',
        'inset-glass': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl':'40px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236060f0' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'mesh-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
      },
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'float-delay':   'float 6s ease-in-out 2s infinite',
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
        'slide-up':      'slide-up 0.5s ease-out',
        'slide-down':    'slide-down 0.5s ease-out',
        'fade-in':       'fade-in 0.3s ease-out',
        'scale-in':      'scale-in 0.3s ease-out',
        'shimmer':       'shimmer 1.5s infinite',
        'spin-slow':     'spin 3s linear infinite',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
        'gradient-x':    'gradient-x 15s ease infinite',
        'gradient-y':    'gradient-y 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,60,245,0.4)' },
          '50%':      { boxShadow: '0 0 40px rgba(99,60,245,0.8)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%':      { transform: 'translateY(0)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'gradient-y': {
          '0%, 100%': { backgroundPosition: '50% 0%' },
          '50%':      { backgroundPosition: '50% 100%' },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth':    'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
