import type { Server } from 'socket.io'
import type { AuthenticatedSocket } from './auth'
import { MEDIA_EVENTS } from './events'

// In-memory media state per room
const roomMediaState = new Map<string, {
  url: string
  mediaType: string
  isPlaying: boolean
  currentTime: number
  hostId: string | null
  updatedAt: number
}>()

export function registerMediaHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId!

  // Load media
  socket.on(MEDIA_EVENTS.LOAD, (data: { roomCode: string; url: string; mediaType: string }) => {
    const { roomCode, url, mediaType } = data
    const state = {
      url,
      mediaType,
      isPlaying: false,
      currentTime: 0,
      hostId: userId,
      updatedAt: Date.now(),
    }
    roomMediaState.set(roomCode, state)
    io.to(roomCode).emit(MEDIA_EVENTS.LOAD, { url, mediaType })
  })

  // Play
  socket.on(MEDIA_EVENTS.PLAY, (data: { roomCode: string; currentTime: number; hostId: string }) => {
    const state = roomMediaState.get(data.roomCode)
    if (state) {
      state.isPlaying = true
      state.currentTime = data.currentTime
      state.updatedAt = Date.now()
    }
    socket.to(data.roomCode).emit(MEDIA_EVENTS.PLAY, data)
  })

  // Pause
  socket.on(MEDIA_EVENTS.PAUSE, (data: { roomCode: string; currentTime: number; hostId: string }) => {
    const state = roomMediaState.get(data.roomCode)
    if (state) {
      state.isPlaying = false
      state.currentTime = data.currentTime
      state.updatedAt = Date.now()
    }
    socket.to(data.roomCode).emit(MEDIA_EVENTS.PAUSE, data)
  })

  // Seek
  socket.on(MEDIA_EVENTS.SEEK, (data: { roomCode: string; currentTime: number; hostId: string }) => {
    const state = roomMediaState.get(data.roomCode)
    if (state) {
      state.currentTime = data.currentTime
      state.updatedAt = Date.now()
    }
    socket.to(data.roomCode).emit(MEDIA_EVENTS.SEEK, data)
  })

  // Periodic sync from host
  socket.on(MEDIA_EVENTS.SYNC, (data: {
    roomCode: string
    url: string
    isPlaying: boolean
    currentTime: number
    hostId: string
  }) => {
    const state = roomMediaState.get(data.roomCode) || {
      url: data.url,
      mediaType: 'video',
      isPlaying: data.isPlaying,
      currentTime: data.currentTime,
      hostId: data.hostId,
      updatedAt: Date.now(),
    }
    state.isPlaying = data.isPlaying
    state.currentTime = data.currentTime
    state.updatedAt = Date.now()
    roomMediaState.set(data.roomCode, state)
    // Don't broadcast sync to everyone — handled by REQUEST_SYNC
  })

  // New participant requests current state
  socket.on(MEDIA_EVENTS.REQUEST_SYNC, (data: { roomCode: string }) => {
    const state = roomMediaState.get(data.roomCode)
    if (state) {
      socket.emit(MEDIA_EVENTS.SYNC, state)
    }
  })
}
