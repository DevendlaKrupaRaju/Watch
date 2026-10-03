'use client'

import { useState } from 'react'
import { Copy, Check, X, Share2, Users } from 'lucide-react'

interface InviteDialogProps {
  roomCode: string
  roomName: string
  isOpen: boolean
  onClose: () => void
}

export function InviteDialog({ roomCode, roomName, isOpen, onClose }: InviteDialogProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  if (!isOpen) return null

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomCode}` : ''

  const copyUrl = async () => {
    await navigator.clipboard.writeText(roomUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName} on WatchHub`,
          text: `Watch movies and hang out with me in ${roomName}!`,
          url: roomUrl,
        })
      } catch {}
    } else {
      copyUrl()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Invite Friends</h3>
            <p className="text-gray-400 text-xs">Share this link to watch together</p>
          </div>
        </div>

        {/* Room Code */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Room Code</label>
          <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-xl p-2.5">
            <span className="font-mono text-lg font-bold tracking-widest text-purple-300 flex-1 px-2">
              {roomCode}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Room Link */}
        <div className="mb-6">
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Direct Invitation Link</label>
          <div className="flex items-center gap-2 bg-gray-800/80 border border-gray-700 rounded-xl p-2.5">
            <input
              readOnly
              value={roomUrl}
              className="bg-transparent text-xs text-gray-300 flex-1 outline-none truncate px-1"
            />
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors shrink-0 shadow-lg shadow-purple-900/40"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Native share button */}
        <button
          onClick={shareNative}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm font-medium rounded-xl transition-colors"
        >
          <Share2 className="w-4 h-4 text-purple-400" />
          Share via Apps / Social
        </button>
      </div>
    </div>
  )
}
