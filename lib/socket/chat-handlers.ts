import type { Server } from 'socket.io'
import type { AuthenticatedSocket } from './auth'
import { CHAT_EVENTS } from './events'
import prisma from '@/lib/db/prisma'

// Rate limiting: track last message times per user
const userMessageTimes = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 10000 // 10 seconds
const RATE_LIMIT_MAX = 10 // max messages per window
const MIN_MESSAGE_INTERVAL = 300 // ms between messages

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const times = userMessageTimes.get(userId) || []
  const recentTimes = times.filter((t) => now - t < RATE_LIMIT_WINDOW)

  if (recentTimes.length >= RATE_LIMIT_MAX) return false
  if (recentTimes.length > 0 && now - recentTimes[recentTimes.length - 1] < MIN_MESSAGE_INTERVAL) return false

  recentTimes.push(now)
  userMessageTimes.set(userId, recentTimes)
  return true
}

// Track last message content per user for duplicate detection
const lastMessages = new Map<string, string>()

export function registerChatHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId!
  const username = socket.username!

  // Send message
  socket.on(CHAT_EVENTS.MESSAGE, async (data: {
    roomCode: string
    content: string
    replyToId?: string
  }) => {
    try {
      const { roomCode, content, replyToId } = data

      // Validate content
      const trimmed = content.trim()
      if (!trimmed || trimmed.length > 2000) {
        socket.emit(CHAT_EVENTS.MESSAGE, { error: 'Invalid message' })
        return
      }

      // Rate limit
      if (!checkRateLimit(userId)) {
        socket.emit(CHAT_EVENTS.MESSAGE, { error: 'Too many messages. Please slow down.' })
        return
      }

      // Duplicate detection
      const lastMsg = lastMessages.get(`${userId}:${roomCode}`)
      if (lastMsg === trimmed) {
        socket.emit(CHAT_EVENTS.MESSAGE, { error: 'Duplicate message' })
        return
      }
      lastMessages.set(`${userId}:${roomCode}`, trimmed)

      // Verify membership
      const member = await prisma.roomMember.findFirst({
        where: { room: { roomCode }, userId },
      })
      if (!member) {
        socket.emit(CHAT_EVENTS.MESSAGE, { error: 'Not a member of this room' })
        return
      }

      // Save message
      const message = await prisma.message.create({
        data: {
          roomId: member.roomId,
          userId,
          content: trimmed,
          messageType: 'TEXT',
          replyToId: replyToId || null,
        },
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          replyTo: {
            include: { user: { select: { id: true, username: true } } },
          },
          reactions: true,
        },
      })

      // Broadcast to room
      io.to(roomCode).emit(CHAT_EVENTS.MESSAGE, { message })
    } catch (error) {
      console.error('Chat message error:', error)
      socket.emit(CHAT_EVENTS.MESSAGE, { error: 'Failed to send message' })
    }
  })

  // Edit message
  socket.on(CHAT_EVENTS.MESSAGE_EDITED, async (data: {
    roomCode: string
    messageId: string
    content: string
  }) => {
    try {
      const { roomCode, messageId, content } = data
      const trimmed = content.trim()
      if (!trimmed || trimmed.length > 2000) return

      const message = await prisma.message.findUnique({ where: { id: messageId } })
      if (!message || message.userId !== userId) {
        socket.emit(CHAT_EVENTS.MESSAGE_EDITED, { error: 'Cannot edit this message' })
        return
      }

      const updated = await prisma.message.update({
        where: { id: messageId },
        data: { content: trimmed, isEdited: true },
      })

      io.to(roomCode).emit(CHAT_EVENTS.MESSAGE_EDITED, {
        messageId,
        content: updated.content,
        isEdited: true,
      })
    } catch (error) {
      console.error('Edit message error:', error)
    }
  })

  // Delete message
  socket.on(CHAT_EVENTS.MESSAGE_DELETED, async (data: {
    roomCode: string
    messageId: string
  }) => {
    try {
      const { roomCode, messageId } = data

      const message = await prisma.message.findUnique({ where: { id: messageId } })
      if (!message) return

      // Owner or host/mod can delete
      const isOwner = message.userId === userId
      if (!isOwner) {
        const member = await prisma.roomMember.findFirst({
          where: { room: { roomCode }, userId },
        })
        if (!member || member.role === 'MEMBER') {
          socket.emit(CHAT_EVENTS.MESSAGE_DELETED, { error: 'Cannot delete this message' })
          return
        }
      }

      await prisma.message.delete({ where: { id: messageId } })
      io.to(roomCode).emit(CHAT_EVENTS.MESSAGE_DELETED, { messageId })
    } catch (error) {
      console.error('Delete message error:', error)
    }
  })

  // Reaction
  socket.on(CHAT_EVENTS.REACTION, async (data: {
    roomCode: string
    messageId: string
    emoji: string
  }) => {
    try {
      const { roomCode, messageId, emoji } = data
      if (!emoji || emoji.length > 10) return

      // Toggle reaction
      const existing = await prisma.messageReaction.findUnique({
        where: { messageId_userId_emoji: { messageId, userId, emoji } },
      })

      if (existing) {
        await prisma.messageReaction.delete({ where: { id: existing.id } })
        io.to(roomCode).emit(CHAT_EVENTS.REACTION, {
          messageId, userId, username, emoji, action: 'remove',
        })
      } else {
        await prisma.messageReaction.create({
          data: { messageId, userId, emoji },
        })
        io.to(roomCode).emit(CHAT_EVENTS.REACTION, {
          messageId, userId, username, emoji, action: 'add',
        })
      }
    } catch (error) {
      console.error('Reaction error:', error)
    }
  })

  // Typing indicator
  socket.on(CHAT_EVENTS.TYPING, (data: { roomCode: string; isTyping: boolean }) => {
    socket.to(data.roomCode).emit(CHAT_EVENTS.TYPING, {
      userId,
      username,
      isTyping: data.isTyping,
    })
  })

  // Pin message (host/mod only)
  socket.on(CHAT_EVENTS.MESSAGE_PINNED, async (data: {
    roomCode: string
    messageId: string
    pinned: boolean
  }) => {
    try {
      const { roomCode, messageId, pinned } = data

      const member = await prisma.roomMember.findFirst({
        where: { room: { roomCode }, userId },
      })
      if (!member || member.role === 'MEMBER') {
        socket.emit(CHAT_EVENTS.MESSAGE_PINNED, { error: 'Insufficient permissions' })
        return
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { isPinned: pinned },
      })

      io.to(roomCode).emit(CHAT_EVENTS.MESSAGE_PINNED, { messageId, pinned })
    } catch (error) {
      console.error('Pin message error:', error)
    }
  })
}
