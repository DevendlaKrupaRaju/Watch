'use client'

import { Crown, Shield, MoreVertical, UserMinus, ArrowRightLeft } from 'lucide-react'
import { useState } from 'react'

interface Participant {
  userId: string
  username: string
  avatarUrl?: string | null
  role: string
  isOnline?: boolean
}

interface ParticipantListProps {
  participants: Participant[]
  onlineUserIds: string[]
  currentUserId: string
  isHost: boolean
  onRemoveUser?: (userId: string) => void
  onTransferHost?: (userId: string) => void
}

export function ParticipantList({
  participants,
  onlineUserIds,
  currentUserId,
  isHost,
  onRemoveUser,
  onTransferHost,
}: ParticipantListProps) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const sortedParticipants = [...participants].sort((a, b) => {
    const roleOrder = { HOST: 0, MODERATOR: 1, MEMBER: 2 }
    const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 2
    const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 2
    if (aOrder !== bOrder) return aOrder - bOrder
    const aOnline = onlineUserIds.includes(a.userId) ? 0 : 1
    const bOnline = onlineUserIds.includes(b.userId) ? 0 : 1
    return aOnline - bOnline
  })

  return (
    <div className="space-y-1">
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Participants ({participants.length})
      </div>
      {sortedParticipants.map((p) => {
        const isOnline = onlineUserIds.includes(p.userId)
        const isCurrentUser = p.userId === currentUserId

        return (
          <div
            key={p.userId}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {p.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${
                    isOnline ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-medium ${isOnline ? 'text-white' : 'text-gray-500'}`}>
                    {p.username}
                    {isCurrentUser && <span className="text-gray-500"> (you)</span>}
                  </span>
                  {p.role === 'HOST' && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                  {p.role === 'MODERATOR' && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                </div>
              </div>
            </div>

            {isHost && !isCurrentUser && p.role !== 'HOST' && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === p.userId ? null : p.userId)}
                  className="p-1 text-gray-600 hover:text-gray-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {menuOpen === p.userId && (
                  <div className="absolute right-0 top-8 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1">
                    <button
                      onClick={() => {
                        onTransferHost?.(p.userId)
                        setMenuOpen(null)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Transfer Host
                    </button>
                    <button
                      onClick={() => {
                        onRemoveUser?.(p.userId)
                        setMenuOpen(null)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                    >
                      <UserMinus className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
