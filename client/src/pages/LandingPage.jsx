/**
 * Landing Page – FindIt Hero & Features
 * Stunning Apple-inspired dark landing page
 */

import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Search, Zap, Shield, MapPin, MessageCircle, Bell,
  ArrowRight, CheckCircle, Star, Users, Package,
  Upload, Brain, HandHeart, ChevronRight, QrCode,
} from 'lucide-react'
import { useRef } from 'react'
import { useDocumentTitle } from '../hooks/index'

// ─── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { value: '50K+', label: 'Items Returned',   icon: HandHeart },
  { value: '98%',  label: 'AI Accuracy',      icon: Brain },
  { value: '120+', label: 'Cities Covered',   icon: MapPin },
  { value: '200K+',label: 'Happy Users',      icon: Users },
]

const features = [
  {
    icon: Brain,
    title: 'AI Image Matching',
    description: 'CLIP-powered vision AI analyzes your item photos and finds visual matches with 98% accuracy.',
    color: 'from-primary-500 to-purple-600',
    glow:  'rgba(79,70,229,0.3)',
  },
  {
    icon: Zap,
    title: 'Instant Notifications',
    description: 'Get real-time alerts via email and in-app notifications the moment a match is found.',
    color: 'from-accent-500 to-blue-600',
    glow:  'rgba(6,182,212,0.3)',
  },
  {
    icon: MapPin,
    title: 'Location Intelligence',
    description: 'Browse items on an interactive map, filter by distance, and find nearby lost/found reports.',
    color: 'from-success-500 to-teal-600',
    glow:  'rgba(34,197,94,0.3)',
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Chat',
    description: 'Securely connect with finders via end-to-end encrypted real-time chat with image sharing.',
    color: 'from-warning-500 to-orange-600',
    glow:  'rgba(245,158,11,0.3)',
  },
  {
    icon: QrCode,
    title: 'QR Code Tags',
    description: 'Every item gets a unique QR code. Anyone who finds your item can instantly access its page.',
    color: 'from-pink-500 to-rose-600',
    glow:  'rgba(236,72,153,0.3)',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is protected with JWT authentication, encrypted storage, and role-based access.',
    color: 'from-indigo-500 to-violet-600',
    glow:  'rgba(99,102,241,0.3)',
  },
]

const howItWorks = [
  { step: '01', title: 'Report Your Item', description: 'Upload photos and describe your lost or found item in seconds.', icon: Upload },
  { step: '02', title: 'AI Scans Everything', description: 'Our CLIP model analyzes images across all reported items instantly.', icon: Brain },
  { step: '03', title: 'Get Matched', description: 'When a match is found above 85% confidence, both users are notified.', icon: Zap },
  { step: '04', title: 'Connect & Return', description: 'Chat securely, arrange handover, and reunite with your belongings.', icon: HandHeart },
]

const testimonials = [
  { name: 'Sarah M.', role: 'Lost her laptop bag', text: 'FindIt matched my laptop bag in under 2 hours! The AI was spot-on. I got my bag back with everything inside.', rating: 5 },
  { name: 'Raj K.', role: 'Found a wallet', text: 'I uploaded a photo of a wallet I found and FindIt automatically matched it to the owner. Amazing technology!', rating: 5 },
  { name: 'Emma L.', role: 'Lost her camera', text: 'The QR code feature is genius. The person who found my camera just scanned it and contacted me immediately.', rating: 5 },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useDocumentTitle('Home')
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div className="min-h-screen bg-dark-900 overflow-x-hidden">

      {/* ─── Navigation ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-base">F</span>
            </div>
            <span className="font-black text-lg gradient-text-primary">FindIt</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-dark-100/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-ghost btn-sm text-dark-100/70 hover:text-white">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm" id="landing-get-started-btn">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 hero-bg" />
        <div className="absolute inset-0 hero-pattern opacity-30" />

        {/* Floating Orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 30, 0], x: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl"
        />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-24"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/30 text-primary-300 text-sm font-medium mb-8"
          >
            <Zap size={14} className="text-primary-400" />
            Powered by CLIP AI Vision
            <span className="badge badge-primary text-xs">New</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-[1.05]"
          >
            Never Lose{' '}
            <span className="gradient-text">Anything</span>
            <br />
            <span className="text-dark-100/90">Again</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-dark-100/60 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            FindIt uses advanced AI to automatically match lost and found items with{' '}
            <strong className="text-dark-100/90">98% accuracy</strong>. Upload a photo,
            describe your item, and let AI do the rest.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link to="/register" id="hero-report-lost-btn"
              className="btn btn-primary btn-xl gap-3">
              Report a Lost Item
              <ArrowRight size={20} />
            </Link>
            <Link to="/register"
              className="btn btn-secondary btn-xl gap-3">
              I Found Something
              <ChevronRight size={20} />
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6 flex-wrap"
          >
            <div className="flex -space-x-2">
              {[1,2,3,4,5].map(i => (
                <img key={i}
                  src={`https://api.dicebear.com/8.x/avataaars/svg?seed=${i}&backgroundColor=4f46e5`}
                  alt={`User ${i}`}
                  className="w-8 h-8 rounded-full ring-2 ring-dark-900"
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-warning-400 text-warning-400" />)}
              <span className="text-sm text-dark-100/60 ml-1">4.9 · 50K+ reunions</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-dark-100/30"
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-dark-100/30 to-transparent" />
        </motion.div>
      </section>

      {/* ─── Stats ────────────────────────────────────────────────────────────── */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <stat.icon size={22} className="text-primary-400" />
                </div>
                <div className="text-3xl font-black gradient-text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-dark-100/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary-400 text-sm font-semibold uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4">
              Everything you need to
              <br /><span className="gradient-text">find what matters</span>
            </h2>
            <p className="text-dark-100/50 text-lg max-w-xl mx-auto">
              A complete platform powered by cutting-edge AI and real-time technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="card card-hover group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:shadow-lg transition-shadow`}
                  style={{ boxShadow: `0 8px 24px ${feature.glow}` }}
                >
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-dark-100/50 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-dark-950/50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-accent-400 text-sm font-semibold uppercase tracking-widest">Process</span>
            <h2 className="text-4xl md:text-5xl font-black mt-3 mb-4">
              From lost to found in
              <br /><span className="gradient-text-accent">4 simple steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative text-center"
              >
                {/* Connector line */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-px bg-gradient-to-r from-primary-500/50 to-transparent z-0" />
                )}

                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 border border-primary-500/30 mb-4">
                  <step.icon size={24} className="text-primary-400" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-dark-100/50 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black mb-4">Real stories,<br /><span className="gradient-text">real reunions</span></h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="fill-warning-400 text-warning-400" />
                  ))}
                </div>
                <p className="text-dark-100/70 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <img
                    src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(t.name)}&backgroundColor=4f46e5&textColor=ffffff`}
                    alt={t.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-dark-100/50">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/50 via-dark-950 to-accent-950/30" />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-0 left-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl -translate-x-1/2"
        />
        <div className="relative z-10 text-center max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Start finding today
            </h2>
            <p className="text-dark-100/60 text-lg mb-10">
              Join 200,000+ users who trust FindIt to recover their belongings.
              Free to use, forever.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/register" id="cta-create-account-btn"
                className="btn btn-primary btn-xl gap-3">
                Create Free Account
                <ArrowRight size={20} />
              </Link>
              <Link to="/search" className="btn btn-secondary btn-xl">
                Browse Items
              </Link>
            </div>
            <p className="text-dark-100/30 text-sm mt-6">
              No credit card required • Free forever • 50K+ items returned
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">F</span>
            </div>
            <span className="font-bold text-sm">FindIt</span>
          </div>
          <p className="text-dark-100/30 text-sm">
            © {new Date().getFullYear()} FindIt. AI Powered Lost & Found Platform.
          </p>
          <div className="flex gap-6 text-sm text-dark-100/50">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
