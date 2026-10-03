'use client'

import { useState } from 'react'
import { Copy, Share2, Settings, Lock, Unlock, Users, Check } from 'lucide-react'

interface RoomHeaderProps {
  roomName: string
  roomCode: string
  isLocked: boolean
  isHost: boolean
  memberCount: number
  onLock?: () => void
  onUnlock?: () => void
  onSettings?: () => void
}

export function RoomHeader({
  roomName,
  roomCode,
  isLocked,
  isHost,
  memberCount,
  onLock,
  onUnlock,
  onSettings,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = roomCode
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareRoom = async () => {
    const url = `${window.location.origin}/room/${roomCode}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${roomName} on WatchHub`, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              {roomName}
              {isLocked && <Lock className="w-4 h-4 text-yellow-400" />}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-xs">{roomCode}</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {memberCount}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors"
            title="Copy room code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Code'}</span>
          </button>

          <button
            onClick={shareRoom}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors"
            title="Share room"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          {isHost && (
            <>
              <button
                onClick={isLocked ? onUnlock : onLock}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isLocked
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
                title={isLocked ? 'Unlock room' : 'Lock room'}
              >
                {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>

              <button
                onClick={onSettings}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors"
                title="Room settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
