'use client'

import { useState } from 'react'
import { Reply, Pencil, Trash2, Pin, SmilePlus } from 'lucide-react'

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

interface MessageBubbleProps {
  message: MessageData
  currentUserId: string
  isHost: boolean
  onReply: () => void
  onEdit: (content: string) => void
  onDelete: () => void
  onReaction: (emoji: string) => void
  onPin: (pinned: boolean) => void
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '👀', '🎉']

export function MessageBubble({
  message,
  currentUserId,
  isHost,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onPin,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showReactions, setShowReactions] = useState(false)

  const isOwn = message.user?.id === currentUserId
  const isSystem = message.messageType !== 'TEXT'

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-gray-500 bg-gray-800/30 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onEdit(editContent.trim())
    }
    setIsEditing(false)
  }

  // Group reactions by emoji
  const groupedReactions = message.reactions.reduce<Record<string, { emoji: string; count: number; users: string[]; hasCurrentUser: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { emoji: r.emoji, count: 0, users: [], hasCurrentUser: false }
    }
    acc[r.emoji].count++
    acc[r.emoji].users.push(r.user.username)
    if (r.userId === currentUserId) acc[r.emoji].hasCurrentUser = true
    return acc
  }, {})

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className="group relative px-2 py-1.5 rounded-lg hover:bg-gray-800/30 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false) }}
    >
      {/* Reply reference */}
      {message.replyTo && (
        <div className="flex items-center gap-1.5 mb-1 ml-9 text-xs text-gray-500">
          <div className="w-4 border-l-2 border-b-2 border-gray-600 h-3 rounded-bl" />
          <span className="text-purple-400">{message.replyTo.user?.username}</span>
          <span className="truncate max-w-[180px]">{message.replyTo.content}</span>
        </div>
      )}

      <div className="flex gap-2.5">
        {/* Avatar */}
        <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-white text-xs font-bold">
            {message.user?.username?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-semibold ${isOwn ? 'text-purple-300' : 'text-gray-200'}`}>
              {message.user?.username || 'Unknown'}
            </span>
            <span className="text-[10px] text-gray-600">{time}</span>
            {message.isEdited && <span className="text-[10px] text-gray-600">(edited)</span>}
            {message.isPinned && <span className="text-[10px] text-yellow-500">📌</span>}
          </div>

          {isEditing ? (
            <div className="mt-1">
              <input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false) }}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-gray-100 focus:border-purple-500 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2 mt-1">
                <button onClick={handleEditSubmit} className="text-xs text-green-400 hover:text-green-300">Save</button>
                <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-400">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Reactions */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {Object.values(groupedReactions).map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReaction(r.emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                    r.hasCurrentUser
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                  title={r.users.join(', ')}
                >
                  <span>{r.emoji}</span>
                  <span>{r.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {showActions && !isEditing && (
        <div className="absolute -top-3 right-2 flex items-center gap-0.5 bg-gray-800 border border-gray-700 rounded-lg shadow-lg px-1 py-0.5">
          <button onClick={() => setShowReactions(!showReactions)} className="p-1 text-gray-400 hover:text-yellow-400 rounded" title="React">
            <SmilePlus className="w-3.5 h-3.5" />
          </button>
          <button onClick={onReply} className="p-1 text-gray-400 hover:text-blue-400 rounded" title="Reply">
            <Reply className="w-3.5 h-3.5" />
          </button>
          {isOwn && (
            <button onClick={() => { setIsEditing(true); setShowActions(false) }} className="p-1 text-gray-400 hover:text-green-400 rounded" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {(isOwn || isHost) && (
            <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-400 rounded" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isHost && (
            <button onClick={() => onPin(!message.isPinned)} className="p-1 text-gray-400 hover:text-yellow-400 rounded" title={message.isPinned ? 'Unpin' : 'Pin'}>
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Quick reactions picker */}
      {showReactions && (
        <div className="absolute -top-10 right-2 flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg px-2 py-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onReaction(emoji); setShowReactions(false) }}
              className="text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
