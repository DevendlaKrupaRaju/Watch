'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Socket } from 'socket.io-client'

const REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '👏', '😮', '😢']

interface FloatingReaction {
  id: string
  emoji: string
  username: string
  x: number
}

interface ReactionsProps {
  socket: Socket | null
  roomCode: string
  username: string
}

export function Reactions({ socket, roomCode, username }: ReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([])

  useEffect(() => {
    if (!socket) return

    const handleReaction = (data: { emoji: string; username: string }) => {
      const id = `${Date.now()}-${Math.random()}`
      const reaction: FloatingReaction = {
        id,
        emoji: data.emoji,
        username: data.username,
        x: 20 + Math.random() * 60,
      }
      setFloatingReactions((prev) => [...prev, reaction])
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id))
      }, 3000)
    }

    socket.on('room:reaction', handleReaction)
    return () => { socket.off('room:reaction', handleReaction) }
  }, [socket])

  const sendReaction = useCallback((emoji: string) => {
    if (!socket) return
    socket.emit('room:reaction', { roomCode, emoji, username })
    setShowPicker(false)
  }, [socket, roomCode, username])

  return (
    <>
      {/* Floating reactions overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-20 text-3xl"
            style={{
              left: `${r.x}%`,
              animation: 'floatUp 3s ease-out forwards',
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-4xl">{r.emoji}</span>
              <span className="text-xs text-white bg-gray-900/70 px-2 py-0.5 rounded-full mt-1">
                {r.username}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors text-lg"
          title="Send reaction"
        >
          😀
        </button>

        {showPicker && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl px-3 py-2">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
