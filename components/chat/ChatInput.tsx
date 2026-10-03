'use client'

import { useState, useRef, useCallback } from 'react'
import { Send, Smile } from 'lucide-react'
import type { Socket } from 'socket.io-client'
import { CHAT_EVENTS } from '@/lib/socket/events'

interface ChatInputProps {
  onSend: (content: string) => void
  socket: Socket | null
  roomCode: string
}

export function ChatInput({ onSend, socket, roomCode }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTypingRef = useRef(false)

  const handleTyping = useCallback(() => {
    if (!socket) return

    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket.emit(CHAT_EVENTS.TYPING, { roomCode, isTyping: true })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
      socket.emit(CHAT_EVENTS.TYPING, { roomCode, isTyping: false })
    }, 2000)
  }, [socket, roomCode])

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return

    onSend(trimmed)
    setMessage('')

    if (socket && isTypingRef.current) {
      isTypingRef.current = false
      socket.emit(CHAT_EVENTS.TYPING, { roomCode, isTyping: false })
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const EMOJI_LIST = ['😀', '😂', '❤️', '🔥', '👍', '👋', '🎉', '😎', '🤔', '😢', '💯', '🙌', '👀', '💪', '🎬', '🍿']

  return (
    <div className="p-3 border-t border-gray-800/50">
      {showEmoji && (
        <div className="mb-2 p-2 bg-gray-800 border border-gray-700 rounded-lg">
          <div className="flex flex-wrap gap-1">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setMessage((prev) => prev + emoji)
                  setShowEmoji(false)
                }}
                className="text-xl p-1 hover:bg-gray-700 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className={`p-2 rounded-lg transition-colors ${
            showEmoji ? 'text-purple-400 bg-purple-500/10' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Smile className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value)
              handleTyping()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/20 resize-none max-h-32 transition-colors"
            style={{ minHeight: '36px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
