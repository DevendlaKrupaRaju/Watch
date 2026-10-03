import type { Server } from 'socket.io'
import type { AuthenticatedSocket } from './auth'
import { MEDIA_EVENTS, PLAYLIST_EVENTS } from './events'

interface PlaylistItem {
  id: string
  url: string
  title: string
  addedBy: string
}

// In-memory media & playlist state per room
const roomMediaState = new Map<string, {
  url: string
  mediaType: string
  isPlaying: boolean
  currentTime: number
  hostId: string | null
  updatedAt: number
}>()

const roomPlaylists = new Map<string, PlaylistItem[]>()

export function registerMediaHandlers(io: Server, socket: AuthenticatedSocket) {
  const userId = socket.userId!
  const username = socket.username || 'User'

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
  })

  // New participant requests current state
  socket.on(MEDIA_EVENTS.REQUEST_SYNC, (data: { roomCode: string }) => {
    const state = roomMediaState.get(data.roomCode)
    if (state) {
      socket.emit(MEDIA_EVENTS.SYNC, state)
    }
    const playlist = roomPlaylists.get(data.roomCode) || []
    socket.emit('playlist:sync', { playlist })
  })

  // ── PLAYLIST HANDLERS ──────────────────────────────────────────────────────
  socket.on(PLAYLIST_EVENTS.ADD, (data: { roomCode: string; url: string; title: string }) => {
    const { roomCode, url, title } = data
    if (!roomPlaylists.has(roomCode)) {
      roomPlaylists.set(roomCode, [])
    }
    const list = roomPlaylists.get(roomCode)!
    const newItem: PlaylistItem = {
      id: Math.random().toString(36).substring(2, 9),
      url,
      title: title || url,
      addedBy: username,
    }
    list.push(newItem)
    io.to(roomCode).emit('playlist:sync', { playlist: list })
  })

  socket.on(PLAYLIST_EVENTS.REMOVE, (data: { roomCode: string; itemId: string }) => {
    const { roomCode, itemId } = data
    const list = roomPlaylists.get(roomCode)
    if (list) {
      const filtered = list.filter((i) => i.id !== itemId)
      roomPlaylists.set(roomCode, filtered)
      io.to(roomCode).emit('playlist:sync', { playlist: filtered })
    }
  })

  socket.on(PLAYLIST_EVENTS.NEXT, (data: { roomCode: string }) => {
    const { roomCode } = data
    const list = roomPlaylists.get(roomCode)
    if (list && list.length > 0) {
      const nextItem = list.shift()!
      roomPlaylists.set(roomCode, list)
      io.to(roomCode).emit('playlist:sync', { playlist: list })

      // Auto-load next item
      const mediaType = nextItem.url.includes('youtube') || nextItem.url.includes('youtu.be') ? 'youtube' : 'video'
      const state = {
        url: nextItem.url,
        mediaType,
        isPlaying: true,
        currentTime: 0,
        hostId: userId,
        updatedAt: Date.now(),
      }
      roomMediaState.set(roomCode, state)
      io.to(roomCode).emit(MEDIA_EVENTS.LOAD, { url: nextItem.url, mediaType })
    }
  })
}
