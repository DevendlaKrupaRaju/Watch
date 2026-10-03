'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  SkipForward, SkipBack, Link as LinkIcon, ListMusic,
  Plus, Trash2, CheckCircle2, Radio,
} from 'lucide-react'
import type { Socket } from 'socket.io-client'
import { MEDIA_EVENTS, PLAYLIST_EVENTS } from '@/lib/socket/events'

interface MediaPlayerProps {
  socket: Socket | null
  roomCode: string
  currentUserId: string
  isHost: boolean
}

interface MediaState {
  url: string
  isPlaying: boolean
  currentTime: number
  duration: number
  hostId: string | null
}

interface PlaylistItem {
  id: string
  url: string
  title: string
  addedBy: string
}

export function MediaPlayer({ socket, roomCode, currentUserId, isHost }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [inputUrl, setInputUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mediaType, setMediaType] = useState<'video' | 'youtube' | 'none'>('none')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([])
  const [playlistInputUrl, setPlaylistInputUrl] = useState('')
  const [playlistInputTitle, setPlaylistInputTitle] = useState('')
  const isSyncingRef = useRef(false)
  const lastSyncRef = useRef(0)

  // Detect media type from URL
  const detectMediaType = (url: string): 'video' | 'youtube' | 'none' => {
    if (!url) return 'none'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'video'
    return 'video'
  }

  const getYouTubeEmbedUrl = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (match) return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&autoplay=0`
    return url
  }

  // Socket sync events
  useEffect(() => {
    if (!socket) return

    const handleMediaLoad = (data: { url: string; mediaType: 'video' | 'youtube' }) => {
      setMediaUrl(data.url)
      setMediaType(data.mediaType)
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handlePlay = (data: { currentTime: number; hostId: string }) => {
      if (data.hostId === currentUserId) return
      isSyncingRef.current = true
      if (videoRef.current) {
        videoRef.current.currentTime = data.currentTime
        videoRef.current.play().catch(() => {})
      }
      setIsPlaying(true)
      setCurrentTime(data.currentTime)
      setTimeout(() => { isSyncingRef.current = false }, 500)
    }

    const handlePause = (data: { currentTime: number; hostId: string }) => {
      if (data.hostId === currentUserId) return
      isSyncingRef.current = true
      if (videoRef.current) {
        videoRef.current.currentTime = data.currentTime
        videoRef.current.pause()
      }
      setIsPlaying(false)
      setCurrentTime(data.currentTime)
      setTimeout(() => { isSyncingRef.current = false }, 500)
    }

    const handleSeek = (data: { currentTime: number; hostId: string }) => {
      if (data.hostId === currentUserId) return
      isSyncingRef.current = true
      if (videoRef.current) {
        videoRef.current.currentTime = data.currentTime
      }
      setCurrentTime(data.currentTime)
      setTimeout(() => { isSyncingRef.current = false }, 500)
    }

    const handleSync = (data: MediaState) => {
      setMediaUrl(data.url)
      setMediaType(detectMediaType(data.url))
      setIsPlaying(data.isPlaying)
      setCurrentTime(data.currentTime)
      if (videoRef.current && Math.abs(videoRef.current.currentTime - data.currentTime) > 2) {
        videoRef.current.currentTime = data.currentTime
      }
    }

    const handlePlaylistSync = (data: { playlist: PlaylistItem[] }) => {
      setPlaylist(data.playlist || [])
    }

    socket.on(MEDIA_EVENTS.LOAD, handleMediaLoad)
    socket.on(MEDIA_EVENTS.PLAY, handlePlay)
    socket.on(MEDIA_EVENTS.PAUSE, handlePause)
    socket.on(MEDIA_EVENTS.SEEK, handleSeek)
    socket.on(MEDIA_EVENTS.SYNC, handleSync)
    socket.on('playlist:sync', handlePlaylistSync)

    // Request sync on join
    socket.emit(MEDIA_EVENTS.REQUEST_SYNC, { roomCode })

    return () => {
      socket.off(MEDIA_EVENTS.LOAD, handleMediaLoad)
      socket.off(MEDIA_EVENTS.PLAY, handlePlay)
      socket.off(MEDIA_EVENTS.PAUSE, handlePause)
      socket.off(MEDIA_EVENTS.SEEK, handleSeek)
      socket.off(MEDIA_EVENTS.SYNC, handleSync)
      socket.off('playlist:sync', handlePlaylistSync)
    }
  }, [socket, currentUserId, roomCode])

  const loadMedia = useCallback((urlToLoad?: string) => {
    const url = (urlToLoad || inputUrl).trim()
    if (!url) return
    const type = detectMediaType(url)
    setMediaUrl(url)
    setMediaType(type)
    setIsPlaying(false)
    setCurrentTime(0)
    setShowUrlInput(false)

    if (socket) {
      socket.emit(MEDIA_EVENTS.LOAD, { roomCode, url, mediaType: type })
    }
  }, [inputUrl, socket, roomCode])

  const handlePlay = useCallback(() => {
    if (!videoRef.current || isSyncingRef.current) return
    const time = videoRef.current.currentTime
    videoRef.current.play().catch(() => {})
    setIsPlaying(true)
    if (socket && isHost) {
      socket.emit(MEDIA_EVENTS.PLAY, { roomCode, currentTime: time, hostId: currentUserId })
    }
  }, [socket, roomCode, currentUserId, isHost])

  const handlePause = useCallback(() => {
    if (!videoRef.current || isSyncingRef.current) return
    const time = videoRef.current.currentTime
    videoRef.current.pause()
    setIsPlaying(false)
    if (socket && isHost) {
      socket.emit(MEDIA_EVENTS.PAUSE, { roomCode, currentTime: time, hostId: currentUserId })
    }
  }, [socket, roomCode, currentUserId, isHost])

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
    if (socket && isHost) {
      socket.emit(MEDIA_EVENTS.SEEK, { roomCode, currentTime: time, hostId: currentUserId })
    }
  }, [socket, roomCode, currentUserId, isHost])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const time = videoRef.current.currentTime
    setCurrentTime(time)

    // Periodic sync every 5 seconds
    const now = Date.now()
    if (socket && isHost && now - lastSyncRef.current > 5000) {
      lastSyncRef.current = now
      socket.emit(MEDIA_EVENTS.SYNC, {
        roomCode,
        url: mediaUrl,
        isPlaying,
        currentTime: time,
        hostId: currentUserId,
      })
    }
  }, [socket, isHost, roomCode, mediaUrl, isPlaying, currentUserId])

  // Auto-play next playlist item on video ended
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false)
    if (socket && isHost && playlist.length > 0) {
      socket.emit(PLAYLIST_EVENTS.NEXT, { roomCode })
    }
  }, [socket, isHost, playlist.length, roomCode])

  const handleAddToPlaylist = (e: React.FormEvent) => {
    e.preventDefault()
    if (!playlistInputUrl.trim() || !socket) return
    socket.emit(PLAYLIST_EVENTS.ADD, {
      roomCode,
      url: playlistInputUrl.trim(),
      title: playlistInputTitle.trim() || playlistInputUrl.trim(),
    })
    setPlaylistInputUrl('')
    setPlaylistInputTitle('')
  }

  const handleRemoveFromPlaylist = (itemId: string) => {
    if (!socket) return
    socket.emit(PLAYLIST_EVENTS.REMOVE, { roomCode, itemId })
  }

  const handlePlayNextInPlaylist = () => {
    if (!socket || !isHost) return
    socket.emit(PLAYLIST_EVENTS.NEXT, { roomCode })
  }

  const handleVolumeChange = (vol: number) => {
    setVolume(vol)
    if (videoRef.current) videoRef.current.volume = vol
    setIsMuted(vol === 0)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  const skip = (seconds: number) => {
    if (videoRef.current) {
      handleSeek(Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds)))
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const toggleFullscreen = () => {
    const el = document.getElementById('room-main-content') || document.getElementById('media-container')
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Empty state
  if (mediaType === 'none') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 relative">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center">
          <Play className="w-10 h-10 text-purple-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-1">Watch Together</h3>
          <p className="text-gray-400 text-sm mb-4">
            {isHost ? 'Load a video URL or YouTube link to start watching together' : 'Waiting for the host to load a video...'}
          </p>
        </div>
        {isHost && (
          <div className="flex flex-col items-center gap-2 w-full max-w-md px-4">
            {showUrlInput ? (
              <div className="flex gap-2 w-full">
                <input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadMedia()}
                  placeholder="Paste video URL or YouTube link..."
                  className="flex-1 bg-gray-800/80 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={() => loadMedia()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Load
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-900/40"
              >
                <LinkIcon className="w-4 h-4" />
                Load Video / Movie
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div id="media-container" className="flex flex-col h-full bg-black relative">
      {/* Video area */}
      <div className="flex-1 relative overflow-hidden">
        {mediaType === 'youtube' ? (
          <iframe
            ref={iframeRef}
            src={getYouTubeEmbedUrl(mediaUrl)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
          />
        )}

        {/* Sync Status Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 bg-gray-900/80 backdrop-blur-md border border-gray-700/60 rounded-full text-[11px] text-gray-300">
          <Radio className={`w-3 h-3 ${isPlaying ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} />
          <span>{isHost ? 'Broadcasting Sync' : 'Synced with Room'}</span>
        </div>

        {/* Change Video Button (host only) */}
        {isHost && (
          <div className="absolute top-3 right-16 z-10">
            {showUrlInput ? (
              <div className="flex gap-2">
                <input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadMedia()}
                  placeholder="New video or YouTube URL..."
                  className="bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none w-64 shadow-xl"
                />
                <button onClick={() => loadMedia()} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-medium">Load</button>
                <button onClick={() => setShowUrlInput(false)} className="px-2 py-1 bg-gray-700 text-white rounded-lg text-xs">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs transition-colors backdrop-blur-sm border border-gray-700/50"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Change video
              </button>
            )}
          </div>
        )}

        {/* ── SHARED PLAYLIST DRAWER (Phase 6 requirement) ── */}
        {showPlaylist && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-gray-950/95 backdrop-blur-md border-l border-gray-800 z-30 flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">Up Next Playlist</h4>
                <span className="text-xs text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded-full font-mono">{playlist.length}</span>
              </div>
              <button onClick={() => setShowPlaylist(false)} className="text-gray-400 hover:text-white text-xs p-1">✕</button>
            </div>

            {/* Add to Playlist Form */}
            <form onSubmit={handleAddToPlaylist} className="space-y-2 mb-4">
              <input
                value={playlistInputTitle}
                onChange={(e) => setPlaylistInputTitle(e.target.value)}
                placeholder="Title (optional)..."
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
              />
              <div className="flex gap-1.5">
                <input
                  value={playlistInputUrl}
                  onChange={(e) => setPlaylistInputUrl(e.target.value)}
                  placeholder="Video URL or YouTube..."
                  className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-200 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>

            {/* Playlist Queue */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {playlist.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs">
                  No upcoming items.<br />Add videos above to build the queue!
                </div>
              ) : (
                playlist.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 transition-colors group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <span className="text-xs font-mono text-gray-500 w-4">{idx + 1}</span>
                      <div className="truncate">
                        <p className="text-xs font-medium text-gray-200 truncate">{item.title}</p>
                        <p className="text-[10px] text-gray-500">Added by {item.addedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isHost && (
                        <button
                          onClick={() => {
                            loadMedia(item.url)
                            handleRemoveFromPlaylist(item.id)
                          }}
                          title="Play Now"
                          className="p-1 text-gray-400 hover:text-purple-400 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFromPlaylist(item.id)}
                        title="Remove"
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Play Next Button for Host */}
            {isHost && playlist.length > 0 && (
              <button
                onClick={handlePlayNextInPlaylist}
                className="w-full mt-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg"
              >
                <SkipForward className="w-3.5 h-3.5" /> Play Next Track
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls Bar (Direct Video and Shared Controls) */}
      <div className="bg-gray-900/95 border-t border-gray-800 px-4 py-2 shrink-0">
        {/* Progress bar */}
        {mediaType === 'video' && (
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={(e) => isHost && handleSeek(Number(e.target.value))}
            disabled={!isHost}
            className="w-full h-1 mb-2 accent-purple-500 cursor-pointer disabled:cursor-default"
          />
        )}

        <div className="flex items-center gap-3">
          {/* Skip back */}
          {mediaType === 'video' && (
            <button onClick={() => skip(-10)} disabled={!isHost} className="text-gray-400 hover:text-white disabled:opacity-40" title="Skip -10s">
              <SkipBack className="w-4 h-4" />
            </button>
          )}

          {/* Play/Pause */}
          {mediaType === 'video' && (
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!isHost}
              className="w-8 h-8 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors shadow-md shadow-purple-900/30"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
          )}

          {/* Skip forward */}
          {mediaType === 'video' && (
            <button onClick={() => skip(10)} disabled={!isHost} className="text-gray-400 hover:text-white disabled:opacity-40" title="Skip +10s">
              <SkipForward className="w-4 h-4" />
            </button>
          )}

          {/* Time display */}
          {mediaType === 'video' && (
            <span className="text-xs text-gray-400 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}

          {mediaType === 'youtube' && (
            <span className="text-xs text-gray-400">
              YouTube Video playing
            </span>
          )}

          <div className="flex-1" />

          {/* Playlist Queue Toggle */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showPlaylist || playlist.length > 0
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Toggle Playlist Queue"
          >
            <ListMusic className="w-4 h-4" />
            <span className="hidden sm:inline">Playlist</span>
            {playlist.length > 0 && (
              <span className="bg-purple-500 text-white text-[10px] px-1.5 rounded-full font-mono">{playlist.length}</span>
            )}
          </button>

          {/* Volume */}
          {mediaType === 'video' && (
            <>
              <button onClick={toggleMute} className="text-gray-400 hover:text-white">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 h-1 accent-purple-500"
              />
            </>
          )}

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white p-1" title="Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
