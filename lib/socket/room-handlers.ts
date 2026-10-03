import type { Server } from 'socket.io'
import type { AuthenticatedSocket } from './auth'
import { ROOM_EVENTS } from './events'
import prisma from '@/lib/db/prisma'

// Track online users per room: Map<roomCode, Set<userId>>
const roomOnlineUsers = new Map<string, Map<string, { socketId: string; username: string }>>()

export function registerRoomHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId!
  const username = socket.username!

  // Join room
  socket.on(ROOM_EVENTS.JOIN, async (data: { roomCode: string }) => {
    try {
      const { roomCode } = data

      // Verify membership
      const member = await prisma.roomMember.findFirst({
        where: { room: { roomCode }, userId },
        include: { room: true },
      })

      if (!member) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'You are not a member of this room' })
        return
      }

      // Join socket room
      socket.join(roomCode)

      // Track online presence
      if (!roomOnlineUsers.has(roomCode)) {
        roomOnlineUsers.set(roomCode, new Map())
      }
      roomOnlineUsers.get(roomCode)!.set(userId, { socketId: socket.id, username })

      // Update lastSeenAt
      await prisma.roomMember.update({
        where: { id: member.id },
        data: { lastSeenAt: new Date() },
      })

      // Notify others
      socket.to(roomCode).emit(ROOM_EVENTS.USER_JOINED, {
        userId,
        username,
        role: member.role,
      })

      // Send current online users to the joining user
      const onlineUsers = Array.from(roomOnlineUsers.get(roomCode)?.entries() || []).map(
        ([uid, info]) => ({ userId: uid, username: info.username })
      )
      socket.emit(ROOM_EVENTS.PARTICIPANT_UPDATE, { onlineUsers })
    } catch (error) {
      console.error('Room join error:', error)
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Failed to join room' })
    }
  })

  // Leave room
  socket.on(ROOM_EVENTS.LEAVE, (data: { roomCode: string }) => {
    handleLeaveRoom(io, socket, data.roomCode, userId, username)
  })

  // Lock room (host only)
  socket.on(ROOM_EVENTS.LOCKED, async (data: { roomCode: string }) => {
    try {
      const room = await prisma.room.findUnique({ where: { roomCode: data.roomCode } })
      if (!room || room.hostId !== userId) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Only the host can lock the room' })
        return
      }
      await prisma.room.update({ where: { id: room.id }, data: { isLocked: true } })
      io.to(data.roomCode).emit(ROOM_EVENTS.LOCKED, { lockedBy: username })
    } catch (error) {
      console.error('Lock room error:', error)
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Failed to lock room' })
    }
  })

  // Unlock room (host only)
  socket.on(ROOM_EVENTS.UNLOCKED, async (data: { roomCode: string }) => {
    try {
      const room = await prisma.room.findUnique({ where: { roomCode: data.roomCode } })
      if (!room || room.hostId !== userId) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Only the host can unlock the room' })
        return
      }
      await prisma.room.update({ where: { id: room.id }, data: { isLocked: false } })
      io.to(data.roomCode).emit(ROOM_EVENTS.UNLOCKED, { unlockedBy: username })
    } catch (error) {
      console.error('Unlock room error:', error)
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Failed to unlock room' })
    }
  })

  // Remove user (host/moderator)
  socket.on(ROOM_EVENTS.USER_REMOVED, async (data: { roomCode: string; targetUserId: string }) => {
    try {
      const member = await prisma.roomMember.findFirst({
        where: { room: { roomCode: data.roomCode }, userId },
      })
      if (!member || member.role === 'MEMBER') {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Insufficient permissions' })
        return
      }

      // Cannot remove the host
      const room = await prisma.room.findUnique({ where: { roomCode: data.roomCode } })
      if (room?.hostId === data.targetUserId) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Cannot remove the host' })
        return
      }

      await prisma.roomMember.deleteMany({
        where: { room: { roomCode: data.roomCode }, userId: data.targetUserId },
      })

      // Notify removed user
      const targetSocket = roomOnlineUsers.get(data.roomCode)?.get(data.targetUserId)
      if (targetSocket) {
        io.to(targetSocket.socketId).emit(ROOM_EVENTS.USER_REMOVED, {
          message: 'You have been removed from the room',
        })
      }

      // Notify room
      io.to(data.roomCode).emit(ROOM_EVENTS.PARTICIPANT_UPDATE, {
        removed: data.targetUserId,
      })

      // Clean up presence
      roomOnlineUsers.get(data.roomCode)?.delete(data.targetUserId)
    } catch (error) {
      console.error('Remove user error:', error)
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Failed to remove user' })
    }
  })

  // Transfer host (host only)
  socket.on(ROOM_EVENTS.HOST_TRANSFERRED, async (data: { roomCode: string; newHostId: string }) => {
    try {
      const room = await prisma.room.findUnique({ where: { roomCode: data.roomCode } })
      if (!room || room.hostId !== userId) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'Only the host can transfer host privileges' })
        return
      }

      // Verify new host is a member
      const newHostMember = await prisma.roomMember.findFirst({
        where: { roomId: room.id, userId: data.newHostId },
      })
      if (!newHostMember) {
        socket.emit(ROOM_EVENTS.ERROR, { message: 'User is not a member of this room' })
        return
      }

      // Update room host
      await prisma.room.update({ where: { id: room.id }, data: { hostId: data.newHostId } })

      // Update roles
      await prisma.roomMember.updateMany({
        where: { roomId: room.id, userId },
        data: { role: 'MEMBER' },
      })
      await prisma.roomMember.updateMany({
        where: { roomId: room.id, userId: data.newHostId },
        data: { role: 'HOST' },
      })

      io.to(data.roomCode).emit(ROOM_EVENTS.HOST_TRANSFERRED, {
        previousHostId: userId,
        newHostId: data.newHostId,
      })
    } catch (error) {
      console.error('Host transfer error:', error)
      socket.emit(ROOM_EVENTS.ERROR, { message: 'Failed to transfer host' })
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove from all rooms this socket was in
    for (const [roomCode, users] of roomOnlineUsers.entries()) {
      if (users.has(userId)) {
        users.delete(userId)
        socket.to(roomCode).emit(ROOM_EVENTS.USER_LEFT, { userId, username })
        if (users.size === 0) {
          roomOnlineUsers.delete(roomCode)
        }
      }
    }
  })
}

function handleLeaveRoom(
  io: Server,
  socket: AuthenticatedSocket,
  roomCode: string,
  userId: string,
  username: string
) {
  socket.leave(roomCode)
  roomOnlineUsers.get(roomCode)?.delete(userId)
  socket.to(roomCode).emit(ROOM_EVENTS.USER_LEFT, { userId, username })
  if (roomOnlineUsers.get(roomCode)?.size === 0) {
    roomOnlineUsers.delete(roomCode)
  }
}

export { roomOnlineUsers }
