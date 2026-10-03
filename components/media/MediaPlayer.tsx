'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  SkipForward, SkipBack, Link as LinkIcon
} from 'lucide-react'
import type { Socket } from 'socket.io-client'

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
  const isSyncingRef = useRef(false)
  const lastSyncRef = useRef(0)

  // Detect media type from URL
  const detectMediaType = (url: string): 'video' | 'youtube' | 'none' => {
    if (!url) return 'none'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return 'video'
    return 'video' // try as video by default
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

    socket.on('media:load', handleMediaLoad)
    socket.on('media:play', handlePlay)
    socket.on('media:pause', handlePause)
    socket.on('media:seek', handleSeek)
    socket.on('media:sync', handleSync)

    // Request sync on join
    socket.emit('media:request-sync', { roomCode })

    return () => {
      socket.off('media:load', handleMediaLoad)
      socket.off('media:play', handlePlay)
      socket.off('media:pause', handlePause)
      socket.off('media:seek', handleSeek)
      socket.off('media:sync', handleSync)
    }
  }, [socket, currentUserId, roomCode])

  const loadMedia = useCallback(() => {
    const url = inputUrl.trim()
    if (!url) return
    const type = detectMediaType(url)
    setMediaUrl(url)
    setMediaType(type)
    setIsPlaying(false)
    setCurrentTime(0)
    setShowUrlInput(false)

    if (socket) {
      socket.emit('media:load', { roomCode, url, mediaType: type })
    }
  }, [inputUrl, socket, roomCode])

  const handlePlay = useCallback(() => {
    if (!videoRef.current || isSyncingRef.current) return
    const time = videoRef.current.currentTime
    videoRef.current.play().catch(() => {})
    setIsPlaying(true)
    if (socket && isHost) {
      socket.emit('media:play', { roomCode, currentTime: time, hostId: currentUserId })
    }
  }, [socket, roomCode, currentUserId, isHost])

  const handlePause = useCallback(() => {
    if (!videoRef.current || isSyncingRef.current) return
    const time = videoRef.current.currentTime
    videoRef.current.pause()
    setIsPlaying(false)
    if (socket && isHost) {
      socket.emit('media:pause', { roomCode, currentTime: time, hostId: currentUserId })
    }
  }, [socket, roomCode, currentUserId, isHost])

  const handleSeek = useCallback((time: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime = time
    setCurrentTime(time)
    if (socket && isHost) {
      socket.emit('media:seek', { roomCode, currentTime: time, hostId: currentUserId })
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
      socket.emit('media:sync', {
        roomCode,
        url: mediaUrl,
        isPlaying,
        currentTime: time,
        hostId: currentUserId,
      })
    }
  }, [socket, isHost, roomCode, mediaUrl, isPlaying, currentUserId])

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
    // Fullscreen the whole room container (includes media + floating video panel)
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

  // Sync isFullscreen state with actual browser fullscreen changes
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Empty state
  if (mediaType === 'none') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl flex items-center justify-center">
          <Play className="w-10 h-10 text-purple-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-1">Watch Together</h3>
          <p className="text-gray-400 text-sm mb-4">
            {isHost ? 'Load a video URL to start watching together' : 'Waiting for the host to load a video...'}
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
                  placeholder="Paste a video URL or YouTube link..."
                  className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={loadMedia}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm transition-colors"
                >
                  Load
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Load Video
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div id="media-container" className="flex flex-col h-full bg-black">
      {/* Video area */}
      <div className="flex-1 relative">
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
          />
        )}

        {/* Load new video button (host only) */}
        {isHost && (
          <div className="absolute top-3 right-3">
            {showUrlInput ? (
              <div className="flex gap-2">
                <input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadMedia()}
                  placeholder="Video URL..."
                  className="bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-purple-500 focus:outline-none w-64"
                />
                <button onClick={loadMedia} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">Load</button>
                <button onClick={() => setShowUrlInput(false)} className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm">✕</button>
              </div>
            ) : (
              <button
                onClick={() => setShowUrlInput(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-900/80 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg text-xs transition-colors"
              >
                <LinkIcon className="w-3.5 h-3.5" /> Change video
              </button>
            )}
          </div>
        )}
      </div>

      {/* Controls (only for direct video, not YouTube) */}
      {mediaType === 'video' && (
        <div className="bg-gray-900/95 border-t border-gray-800 px-4 py-2">
          {/* Progress bar */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            value={currentTime}
            onChange={(e) => isHost && handleSeek(Number(e.target.value))}
            disabled={!isHost}
            className="w-full h-1 mb-2 accent-purple-500 cursor-pointer disabled:cursor-default"
          />

          <div className="flex items-center gap-3">
            {/* Skip back */}
            <button onClick={() => skip(-10)} disabled={!isHost} className="text-gray-400 hover:text-white disabled:opacity-40">
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!isHost}
              className="w-8 h-8 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            {/* Skip forward */}
            <button onClick={() => skip(10)} disabled={!isHost} className="text-gray-400 hover:text-white disabled:opacity-40">
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Time */}
            <span className="text-xs text-gray-400 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {!isHost && (
              <span className="text-xs text-gray-600">Host controls playback</span>
            )}

            {/* Volume */}
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

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-gray-400 hover:text-white">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
