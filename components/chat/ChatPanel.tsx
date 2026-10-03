'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { TypingIndicator } from './TypingIndicator'
import type { Socket } from 'socket.io-client'
import { CHAT_EVENTS } from '@/lib/socket/events'

interface MessageData {
  id: string
  content: string
  messageType: string
  isEdited: boolean
  isPinned: boolean
  createdAt: string
  user: { id: string; username: string; avatarUrl: string | null } | null
  replyTo?: {
    id: string
    content: string
    user: { id: string; username: string } | null
  } | null
  reactions: {
    id: string
    emoji: string
    userId: string
    user: { id: string; username: string }
  }[]
}

interface TypingUser {
  userId: string
  username: string
}

interface ChatPanelProps {
  roomCode: string
  socket: Socket | null
  currentUserId: string
  isHost: boolean
}

export function ChatPanel({ roomCode, socket, currentUserId, isHost }: ChatPanelProps) {
  const [messages, setMessages] = useState<MessageData[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [replyTo, setReplyTo] = useState<MessageData | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [initialLoad, setInitialLoad] = useState(true)

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/rooms/${roomCode}/messages?limit=50`)
        const data = await res.json()
        if (data.success) {
          setMessages(data.data.messages)
          setHasMore(data.data.hasMore)
          setInitialLoad(false)
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
        setInitialLoad(false)
      }
    }
    loadMessages()
  }, [roomCode])

  // Auto-scroll on new messages
  useEffect(() => {
    if (!initialLoad) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, initialLoad])

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const handleMessage = (data: { message?: MessageData; error?: string }) => {
      if (data.error || !data.message) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.message!.id)) return prev
        return [...prev, data.message!]
      })
    }

    const handleEdited = (data: { messageId: string; content: string; isEdited: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === data.messageId ? { ...m, content: data.content, isEdited: data.isEdited } : m)
      )
    }

    const handleDeleted = (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId))
    }

    const handleReaction = (data: { messageId: string; userId: string; username: string; emoji: string; action: string }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m
          const reactions = data.action === 'add'
            ? [...m.reactions, { id: `${data.messageId}-${data.userId}-${data.emoji}`, emoji: data.emoji, userId: data.userId, user: { id: data.userId, username: data.username } }]
            : m.reactions.filter((r) => !(r.userId === data.userId && r.emoji === data.emoji))
          return { ...m, reactions }
        })
      )
    }

    const handleTyping = (data: { userId: string; username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (prev.some((u) => u.userId === data.userId)) return prev
          return [...prev, { userId: data.userId, username: data.username }]
        }
        return prev.filter((u) => u.userId !== data.userId)
      })
    }

    const handlePinned = (data: { messageId: string; pinned: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => m.id === data.messageId ? { ...m, isPinned: data.pinned } : m)
      )
    }

    socket.on(CHAT_EVENTS.MESSAGE, handleMessage)
    socket.on(CHAT_EVENTS.MESSAGE_EDITED, handleEdited)
    socket.on(CHAT_EVENTS.MESSAGE_DELETED, handleDeleted)
    socket.on(CHAT_EVENTS.REACTION, handleReaction)
    socket.on(CHAT_EVENTS.TYPING, handleTyping)
    socket.on(CHAT_EVENTS.MESSAGE_PINNED, handlePinned)

    return () => {
      socket.off(CHAT_EVENTS.MESSAGE, handleMessage)
      socket.off(CHAT_EVENTS.MESSAGE_EDITED, handleEdited)
      socket.off(CHAT_EVENTS.MESSAGE_DELETED, handleDeleted)
      socket.off(CHAT_EVENTS.REACTION, handleReaction)
      socket.off(CHAT_EVENTS.TYPING, handleTyping)
      socket.off(CHAT_EVENTS.MESSAGE_PINNED, handlePinned)
    }
  }, [socket])

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return
    setIsLoadingMore(true)
    try {
      const cursor = messages[0]?.id
      const res = await fetch(`/api/rooms/${roomCode}/messages?limit=50&cursor=${cursor}`)
      const data = await res.json()
      if (data.success) {
        setMessages((prev) => [...data.data.messages, ...prev])
        setHasMore(data.data.hasMore)
      }
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, messages, roomCode])

  const sendMessage = useCallback((content: string) => {
    if (!socket || !content.trim()) return
    socket.emit(CHAT_EVENTS.MESSAGE, {
      roomCode,
      content: content.trim(),
      replyToId: replyTo?.id,
    })
    setReplyTo(null)
  }, [socket, roomCode, replyTo])

  const editMessage = useCallback((messageId: string, content: string) => {
    if (!socket) return
    socket.emit(CHAT_EVENTS.MESSAGE_EDITED, { roomCode, messageId, content })
  }, [socket, roomCode])

  const deleteMessage = useCallback((messageId: string) => {
    if (!socket) return
    socket.emit(CHAT_EVENTS.MESSAGE_DELETED, { roomCode, messageId })
  }, [socket, roomCode])

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!socket) return
    socket.emit(CHAT_EVENTS.REACTION, { roomCode, messageId, emoji })
  }, [socket, roomCode])

  const pinMessage = useCallback((messageId: string, pinned: boolean) => {
    if (!socket) return
    socket.emit(CHAT_EVENTS.MESSAGE_PINNED, { roomCode, messageId, pinned })
  }, [socket, roomCode])

  const pinnedMessages = messages.filter((m) => m.isPinned)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Chat</h3>
          <span className="text-xs text-gray-500">({messages.length})</span>
        </div>
      </div>

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="px-3 py-2 bg-yellow-500/5 border-b border-yellow-500/20">
          <p className="text-xs text-yellow-400 font-medium">📌 {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {hasMore && (
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full py-2 text-xs text-purple-400 hover:text-purple-300 disabled:text-gray-600"
          >
            {isLoadingMore ? 'Loading...' : 'Load earlier messages'}
          </button>
        )}

        {messages.length === 0 && !initialLoad && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageCircle className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No messages yet</p>
            <p className="text-gray-600 text-xs mt-1">Be the first to say hi! 👋</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentUserId}
            isHost={isHost}
            onReply={() => setReplyTo(msg)}
            onEdit={(content) => editMessage(msg.id, content)}
            onDelete={() => deleteMessage(msg.id)}
            onReaction={(emoji) => toggleReaction(msg.id, emoji)}
            onPin={(pinned) => pinMessage(msg.id, pinned)}
          />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers.filter((u) => u.userId !== currentUserId)} />

      {/* Reply indicator */}
      {replyTo && (
        <div className="px-3 py-2 bg-gray-800/50 border-t border-gray-700/50 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Replying to <span className="text-purple-400 font-medium">{replyTo.user?.username}</span>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        socket={socket}
        roomCode={roomCode}
      />
    </div>
  )
}
