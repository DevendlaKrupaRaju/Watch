'use client'

import { useState, useEffect, useCallback } from 'react'
import { Hand } from 'lucide-react'
import type { Socket } from 'socket.io-client'

interface HandRaiseProps {
  socket: Socket | null
  roomCode: string
  userId: string
  username: string
}

interface RaisedHand {
  userId: string
  username: string
}

export function HandRaise({ socket, roomCode, userId, username }: HandRaiseProps) {
  const [isRaised, setIsRaised] = useState(false)
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([])
  const [showList, setShowList] = useState(false)

  useEffect(() => {
    if (!socket) return

    const handleHandRaised = (data: RaisedHand) => {
      setRaisedHands((prev) => {
        if (prev.some((h) => h.userId === data.userId)) return prev
        return [...prev, data]
      })
    }

    const handleHandLowered = (data: { userId: string }) => {
      setRaisedHands((prev) => prev.filter((h) => h.userId !== data.userId))
    }

    socket.on('room:hand-raised', handleHandRaised)
    socket.on('room:hand-lowered', handleHandLowered)

    return () => {
      socket.off('room:hand-raised', handleHandRaised)
      socket.off('room:hand-lowered', handleHandLowered)
    }
  }, [socket])

  const toggleHand = useCallback(() => {
    if (!socket) return
    if (isRaised) {
      socket.emit('room:hand-lowered', { roomCode, userId })
    } else {
      socket.emit('room:hand-raised', { roomCode, userId, username })
    }
    setIsRaised(!isRaised)
  }, [socket, roomCode, userId, username, isRaised])

  return (
    <div className="relative">
      <button
        onClick={() => {
          toggleHand()
          if (raisedHands.length > 0) setShowList(!showList)
        }}
        className={`p-2 rounded-lg transition-colors ${
          isRaised
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
        title={isRaised ? 'Lower hand' : 'Raise hand'}
      >
        <Hand className="w-5 h-5" />
      </button>

      {raisedHands.length > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-500 text-gray-900 text-[10px] font-bold rounded-full flex items-center justify-center">
          {raisedHands.length}
        </span>
      )}

      {showList && raisedHands.length > 0 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-3 py-2 min-w-[140px] z-10">
          <p className="text-xs text-yellow-400 font-medium mb-1">✋ Raised hands</p>
          {raisedHands.map((h) => (
            <p key={h.userId} className="text-xs text-gray-300 py-0.5">{h.username}</p>
          ))}
        </div>
      )}
    </div>
  )
}
