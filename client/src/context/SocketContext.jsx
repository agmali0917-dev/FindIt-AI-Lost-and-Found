/**
 * Socket Context
 * Manages Socket.io connection and real-time events
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket]       = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (!isAuthenticated) {
      socket?.disconnect()
      setSocket(null)
      return
    }

    const token = localStorage.getItem('accessToken')
    const s = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    s.on('connect', () => {
      console.log('🔌 Socket connected:', s.id)
    })

    s.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
    })

    s.on('user:online', ({ userId, online }) => {
      setOnlineUsers(prev =>
        online
          ? [...new Set([...prev, userId])]
          : prev.filter(id => id !== userId)
      )
    })

    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [isAuthenticated])

  const joinChat = (chatId) => socket?.emit('chat:join', chatId)
  const leaveChat = (chatId) => socket?.emit('chat:leave', chatId)
  const sendTyping = (chatId, isTyping) => socket?.emit('chat:typing', { chatId, isTyping })

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, joinChat, leaveChat, sendTyping }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
