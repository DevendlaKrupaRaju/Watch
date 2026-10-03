'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSocket } from './use-socket'
import { ROOM_EVENTS } from '@/lib/socket/events'

interface OnlineUser {
  userId: string
  username: string
}

export function useRoom(roomCode: string) {
  const { socket, isConnected } = useSocket()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [error, setError] = useState<string | null>(null)

  // Join room via socket
  useEffect(() => {
    if (!socket || !isConnected || !roomCode) return

    socket.emit(ROOM_EVENTS.JOIN, { roomCode })

    // Listen for events
    const handleParticipantUpdate = (data: { onlineUsers?: OnlineUser[]; removed?: string }) => {
      if (data.onlineUsers) {
        setOnlineUsers(data.onlineUsers)
      }
      if (data.removed) {
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.removed))
      }
    }

    const handleUserJoined = (data: OnlineUser) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev
        return [...prev, data]
      })
    }

    const handleUserLeft = (data: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId))
    }

    const handleRemoved = (data: { message: string }) => {
      setError(data.message)
    }

    const handleError = (data: { message: string }) => {
      setError(data.message)
    }

    socket.on(ROOM_EVENTS.PARTICIPANT_UPDATE, handleParticipantUpdate)
    socket.on(ROOM_EVENTS.USER_JOINED, handleUserJoined)
    socket.on(ROOM_EVENTS.USER_LEFT, handleUserLeft)
    socket.on(ROOM_EVENTS.USER_REMOVED, handleRemoved)
    socket.on(ROOM_EVENTS.ERROR, handleError)

    return () => {
      socket.emit(ROOM_EVENTS.LEAVE, { roomCode })
      socket.off(ROOM_EVENTS.PARTICIPANT_UPDATE, handleParticipantUpdate)
      socket.off(ROOM_EVENTS.USER_JOINED, handleUserJoined)
      socket.off(ROOM_EVENTS.USER_LEFT, handleUserLeft)
      socket.off(ROOM_EVENTS.USER_REMOVED, handleRemoved)
      socket.off(ROOM_EVENTS.ERROR, handleError)
    }
  }, [socket, isConnected, roomCode])

  const leaveRoom = useCallback(() => {
    if (socket && isConnected) {
      socket.emit(ROOM_EVENTS.LEAVE, { roomCode })
    }
  }, [socket, isConnected, roomCode])

  const lockRoom = useCallback(() => {
    if (socket && isConnected) {
      socket.emit(ROOM_EVENTS.LOCKED, { roomCode })
    }
  }, [socket, isConnected, roomCode])

  const unlockRoom = useCallback(() => {
    if (socket && isConnected) {
      socket.emit(ROOM_EVENTS.UNLOCKED, { roomCode })
    }
  }, [socket, isConnected, roomCode])

  const removeUser = useCallback((targetUserId: string) => {
    if (socket && isConnected) {
      socket.emit(ROOM_EVENTS.USER_REMOVED, { roomCode, targetUserId })
    }
  }, [socket, isConnected, roomCode])

  const transferHost = useCallback((newHostId: string) => {
    if (socket && isConnected) {
      socket.emit(ROOM_EVENTS.HOST_TRANSFERRED, { roomCode, newHostId })
    }
  }, [socket, isConnected, roomCode])

  return {
    onlineUsers,
    isConnected,
    error,
    leaveRoom,
    lockRoom,
    unlockRoom,
    removeUser,
    transferHost,
  }
}
