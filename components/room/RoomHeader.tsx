'use client'

import { useState } from 'react'
import { Copy, Share2, Settings, Lock, Unlock, Users, Check, MessageSquare } from 'lucide-react'

interface RoomHeaderProps {
  roomName: string
  roomCode: string
  isLocked: boolean
  isHost: boolean
  memberCount: number
  onLock?: () => void
  onUnlock?: () => void
  onSettings?: () => void
  onInvite?: () => void
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
  onInvite,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false)

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
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

  return (
    <div className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800/60 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold text-white flex items-center gap-2">
              {roomName}
              {isLocked && <Lock className="w-3.5 h-3.5 text-yellow-400" />}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="font-mono bg-gray-800 px-2 py-0.5 rounded text-[11px] text-purple-300 font-semibold">{roomCode}</span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-gray-500" />
                {memberCount} online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Code */}
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white rounded-lg bg-gray-800/60 hover:bg-gray-800 transition-colors"
            title="Copy room code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          {/* Invite Dialog Button */}
          <button
            onClick={onInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors shadow-md shadow-purple-900/30"
            title="Invite friends"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite</span>
          </button>

          {/* Host Settings */}
          {isHost && (
            <>
              <button
                onClick={isLocked ? onUnlock : onLock}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isLocked
                    ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={isLocked ? 'Unlock room' : 'Lock room'}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>

              <button
                onClick={onSettings}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
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
