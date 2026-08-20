/**
 * Chat Page – Real-time messaging with Socket.io
 */

import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Image as ImageIcon, MessageCircle, ArrowLeft, MoreVertical } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import { chatService } from '../services'
import { Avatar, EmptyState, Skeleton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { useDocumentTitle } from '../hooks/index'
import { format, isToday, isYesterday } from 'date-fns'
import clsx from 'clsx'

// ─── Chat List Item ────────────────────────────────────────────────────────────
const ChatListItem = ({ chat, isActive, onClick }) => {
  const { user } = useAuth()
  const other = chat.participants?.find(p => p._id !== user?._id)

  return (
    <button onClick={onClick}
      className={clsx('w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all',
        isActive ? 'bg-primary-600/20 border border-primary-500/30' : 'hover:bg-white/5'
      )}>
      <div className="relative">
        <Avatar src={other?.avatar?.url} name={other?.name} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{other?.name}</p>
        <p className="text-xs text-dark-100/40 truncate">
          {chat.lastMessage?.content || 'Start a conversation'}
        </p>
      </div>
      <div className="text-[10px] text-dark-100/30 shrink-0">
        {chat.lastMessageAt ? format(new Date(chat.lastMessageAt), 'HH:mm') : ''}
      </div>
    </button>
  )
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ message, isMine }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={clsx('flex gap-2 items-end mb-3', isMine ? 'flex-row-reverse' : 'flex-row')}
  >
    {!isMine && (
      <Avatar src={message.sender?.avatar?.url} name={message.sender?.name} size="xs" />
    )}
    <div className={clsx('message-bubble', isMine ? 'sent' : 'received')}>
      {message.image?.url && (
        <img src={message.image.url} alt="Shared" className="rounded-lg max-w-xs mb-1" />
      )}
      {message.isDeleted ? (
        <span className="italic text-xs opacity-60">Message deleted</span>
      ) : (
        <span>{message.content}</span>
      )}
      <p className={clsx('text-[10px] mt-1 opacity-60', isMine ? 'text-right' : 'text-left')}>
        {format(new Date(message.createdAt), 'HH:mm')}
      </p>
    </div>
  </motion.div>
)

// ─── Chat Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  useDocumentTitle('Messages')
  const { chatId }    = useParams()
  const { user }      = useAuth()
  const { socket, joinChat, leaveChat, sendTyping } = useSocket()
  const queryClient   = useQueryClient()

  const [messages, setMessages]   = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [activeChat, setActiveChat] = useState(chatId || null)
  const [typing, setTyping]         = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // ─── Fetch chats list ──────────────────────────────────────────────────────
  const { data: chatsData } = useQuery({
    queryKey: ['chats'],
    queryFn:  () => chatService.getChats(),
    select:   d => d.data.data,
    refetchInterval: 30000,
  })

  // ─── Fetch messages for active chat ───────────────────────────────────────
  const { data: msgsData, isLoading: msgsLoading } = useQuery({
    queryKey: ['chat-messages', activeChat],
    queryFn:  () => chatService.getMessages(activeChat),
    select:   d => d.data.data.messages,
    enabled:  !!activeChat,
    onSuccess: (data) => setMessages(data || []),
  })

  useEffect(() => { if (msgsData) setMessages(msgsData) }, [msgsData])

  // ─── Socket.io ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !activeChat) return
    joinChat(activeChat)

    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg])
      if (msg.sender._id !== user?._id) {
        queryClient.invalidateQueries({ queryKey: ['chats'] })
      }
    }

    const handleTyping = ({ userId, isTyping }) => {
      if (userId !== user?._id) setOtherTyping(isTyping)
    }

    socket.on('chat:message', handleNewMessage)
    socket.on('chat:typing',  handleTyping)

    return () => {
      socket.off('chat:message', handleNewMessage)
      socket.off('chat:typing',  handleTyping)
      leaveChat(activeChat)
    }
  }, [socket, activeChat])

  // ─── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // ─── Send Message ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (content) => chatService.sendMessage(activeChat, { content }),
    onError: () => toast.error('Failed to send message'),
  })

  const handleSend = () => {
    if (!newMessage.trim() || !activeChat) return
    setNewMessage('')
    sendMutation.mutate(newMessage.trim())
    sendTyping(activeChat, false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    if (!typing) {
      setTyping(true)
      sendTyping(activeChat, true)
      setTimeout(() => { setTyping(false); sendTyping(activeChat, false) }, 2000)
    }
  }

  const activeChats = chatsData || []
  const activeChatData = activeChats.find(c => c._id === activeChat)
  const otherUser = activeChatData?.participants?.find(p => p._id !== user?._id)

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Chats List */}
      <div className={clsx(
        'w-full md:w-72 shrink-0 border-r border-white/5 flex flex-col',
        activeChat ? 'hidden md:flex' : 'flex'
      )}>
        <div className="p-4 border-b border-white/5">
          <h2 className="font-bold flex items-center gap-2">
            <MessageCircle size={18} className="text-primary-400" /> Messages
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeChats.length === 0 ? (
            <div className="text-center py-8 text-dark-100/40 text-sm">
              <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
              No conversations yet
            </div>
          ) : (
            activeChats.map(chat => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                isActive={chat._id === activeChat}
                onClick={() => setActiveChat(chat._id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Message Area */}
      {activeChat ? (
        <div className={clsx('flex-1 flex flex-col', activeChat ? 'flex' : 'hidden md:flex')}>
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 glass-dark">
            <button onClick={() => setActiveChat(null)} className="md:hidden btn btn-ghost btn-icon btn-sm mr-1">
              <ArrowLeft size={18} />
            </button>
            {otherUser && (
              <>
                <Avatar src={otherUser.avatar?.url} name={otherUser.name} size="sm" />
                <div>
                  <p className="font-semibold text-sm">{otherUser.name}</p>
                  <p className="text-xs text-success-400">Online</p>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {msgsLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-3/4" />)}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center text-dark-100/40">
                  <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Start the conversation</p>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg._id} message={msg} isMine={msg.sender._id === user?._id} />
              ))
            )}

            {/* Typing indicator */}
            {otherTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-2 mb-3">
                <Avatar src={otherUser?.avatar?.url} name={otherUser?.name} size="xs" />
                <div className="message-bubble received py-2 px-3">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-dark-100/50"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5 glass-dark">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                rows={1}
                className="input flex-1 resize-none py-2.5 text-sm max-h-32"
                style={{ overflowY: 'auto' }}
                id="chat-message-input"
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="btn btn-primary btn-icon"
                id="chat-send-btn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <EmptyState
            icon={MessageCircle}
            title="Select a conversation"
            description="Choose a conversation from the list to start messaging"
          />
        </div>
      )}
    </div>
  )
}
