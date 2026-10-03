'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  GridLayout,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Track } from 'livekit-client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Video, VideoOff, Mic, MicOff, PhoneOff,
  Monitor, MonitorOff, Maximize2, Minimize2,
  ChevronDown, ChevronUp, X, GripHorizontal,
} from 'lucide-react'

interface VideoGridProps {
  roomCode: string
  onLeaveCall: () => void
  overlay?: boolean
}

export function VideoGrid({ roomCode, onLeaveCall, overlay = false }: VideoGridProps) {
  const [token, setToken] = useState<string | null>(null)
  const [livekitUrl, setLivekitUrl] = useState<string>('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [isInCall, setIsInCall] = useState(false)

  const joinCall = useCallback(async () => {
    setIsJoining(true)
    setError('')
    try {
      const res = await fetch(`/api/rooms/${roomCode}/token`, { method: 'POST' })
      const data = await res.json()
      if (!data.success) { setError(data.error || 'Failed to join call'); return }
      if (!data.data.url) { setError('LiveKit not configured'); return }
      setToken(data.data.token)
      setLivekitUrl(data.data.url)
      setIsInCall(true)
    } catch {
      setError('Failed to connect to video call')
    } finally {
      setIsJoining(false)
    }
  }, [roomCode])

  const handleDisconnect = useCallback(() => {
    setToken(null)
    setIsInCall(false)
    onLeaveCall()
  }, [onLeaveCall])

  // ── OVERLAY MODE ──────────────────────────────────────────────
  if (overlay) {
    if (!isInCall || !token || !livekitUrl) {
      return (
        <div className="absolute top-20 right-4 z-50">
          {error && (
            <p className="text-red-400 text-xs mb-2 bg-gray-900/90 px-2 py-1 rounded">{error}</p>
          )}
          <button
            onClick={joinCall}
            disabled={isJoining}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-2xl shadow-green-900/50 transition-all border border-green-500/30"
          >
            {isJoining
              ? <><LoadingSpinner size="sm" /> Connecting...</>
              : <><Video className="w-4 h-4" /> Join Call</>}
          </button>
        </div>
      )
    }

    return (
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
        style={{ background: 'transparent', position: 'static' }}
      >
        <RoomAudioRenderer />
        <DraggableFloatingPanel onLeave={handleDisconnect} />
      </LiveKitRoom>
    )
  }

  // ── STANDALONE FULL MODE ──────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => { setError(''); joinCall() }}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm">
          Try Again
        </button>
      </div>
    )
  }

  if (!isInCall || !token || !livekitUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center justify-center">
          <Video className="w-10 h-10 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Video Call</h3>
        <p className="text-gray-400 text-sm">Join to see and hear others</p>
        <button onClick={joinCall} disabled={isJoining}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50">
          {isJoining ? <><LoadingSpinner size="sm" /> Connecting...</> : 'Join Call'}
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <LiveKitRoom token={token} serverUrl={livekitUrl} onDisconnected={handleDisconnect}
        className="flex-1 flex flex-col" data-lk-theme="default">
        <FullGrid />
        <RoomAudioRenderer />
        <FullControls onLeave={handleDisconnect} />
      </LiveKitRoom>
    </div>
  )
}

// ── DRAGGABLE FLOATING PANEL ──────────────────────────────────────────────────
function DraggableFloatingPanel({ onLeave }: { onLeave: () => void }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  // Start at top-right of parent container
  const [pos, setPos] = useState({ x: 12, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  )
  const participants = useParticipants()

  // Mouse drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    setIsDragging(true)
  }, [pos])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      const nx = Math.max(0, Math.min(window.innerWidth - 210, e.clientX - dragOffset.current.x))
      const ny = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y))
      setPos({ x: nx, y: ny })
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging])

  // Touch drag (mobile)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragOffset.current = { x: touch.clientX - pos.x, y: touch.clientY - pos.y }
    setIsDragging(true)
  }, [pos])

  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const nx = Math.max(0, Math.min(window.innerWidth - 210, touch.clientX - dragOffset.current.x))
      const ny = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragOffset.current.y))
      setPos({ x: nx, y: ny })
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [isDragging])

  return (
    <>
      {/* ── FULLSCREEN MODAL — covers entire parent container ── */}
      {isFullscreen && (
        <div className="absolute inset-0 z-[9999] bg-gray-950 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white font-semibold text-sm">Video Call</span>
              <span className="text-gray-500 text-xs">· {participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors text-sm"
            >
              <Minimize2 className="w-4 h-4" /> Exit Fullscreen
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <FullGrid />
          </div>
          <FullControls onLeave={onLeave} />
        </div>
      )}

      {/* ── DRAGGABLE FLOATING PANEL ── */}
      {!isFullscreen && (
        <div
          ref={panelRef}
          className="absolute z-50 w-52 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-700/60 bg-gray-900/95 backdrop-blur-md"
          style={{
            left: pos.x,
            top: pos.y,
            userSelect: 'none',
            cursor: isDragging ? 'grabbing' : 'auto',
          }}
        >
          {/* ── Drag handle / header ── */}
          <div
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            className="flex items-center justify-between px-3 py-2 bg-gray-800/90 border-b border-gray-700/50 cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal className="w-3.5 h-3.5 text-gray-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white text-xs font-semibold">
                In Call · {participants.length}
              </span>
            </div>
            <div
              className="flex items-center gap-0.5"
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            >
              <button onClick={() => setIsFullscreen(true)} title="Fullscreen"
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsCollapsed(v => !v)} title={isCollapsed ? 'Expand' : 'Collapse'}
                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button onClick={onLeave} title="End call"
                className="p-1 hover:bg-red-600 rounded text-red-400 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── Video tiles ── */}
          {!isCollapsed && (
            <div className="flex flex-col gap-1.5 p-2">
              {tracks.length === 0 ? (
                <div className="h-28 bg-gray-800 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="w-5 h-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-gray-500 text-xs">Waiting for others...</p>
                  </div>
                </div>
              ) : (
                tracks.slice(0, 4).map((track, i) => (
                  <div key={i} className="w-full rounded-xl overflow-hidden bg-gray-800 border border-gray-700"
                    style={{ aspectRatio: '16/9' }}>
                    <ParticipantTile trackRef={track} className="w-full h-full" />
                  </div>
                ))
              )}
              {participants.length > 4 && (
                <button onClick={() => setIsFullscreen(true)}
                  className="text-center text-purple-400 hover:text-purple-300 text-xs py-1 transition-colors">
                  +{participants.length - 4} more · View all ↗
                </button>
              )}
            </div>
          )}

          {/* ── Controls ── */}
          {!isCollapsed && (
            <div
              className="border-t border-gray-700/50 px-3 py-2.5"
              onMouseDown={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
            >
              <InlineControls onLeave={onLeave} />
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ── INLINE CONTROLS ───────────────────────────────────────────────────────────
function InlineControls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const toggleMic = async () => {
    try { await localParticipant.setMicrophoneEnabled(!isMicOn); setIsMicOn(v => !v) }
    catch (e) { console.error(e) }
  }
  const toggleCam = async () => {
    try { await localParticipant.setCameraEnabled(!isCamOn); setIsCamOn(v => !v) }
    catch (e) { console.error(e) }
  }
  const toggleShare = async () => {
    try { await localParticipant.setScreenShareEnabled(!isSharing); setIsSharing(v => !v) }
    catch (e) { console.error(e) }
  }
  const handleLeave = () => { room.disconnect(); onLeave() }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button onClick={toggleMic} title={isMicOn ? 'Mute mic' : 'Unmute mic'}
          className={`p-2 rounded-lg transition-colors text-xs flex flex-col items-center gap-0.5 ${isMicOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
          {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>
        <button onClick={toggleCam} title={isCamOn ? 'Cam off' : 'Cam on'}
          className={`p-2 rounded-lg transition-colors ${isCamOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
          {isCamOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
        </button>
        <button onClick={toggleShare} title={isSharing ? 'Stop share' : 'Share screen'}
          className={`p-2 rounded-lg transition-colors ${isSharing ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
          {isSharing ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
        </button>
      </div>
      <button onClick={handleLeave} title="Leave call"
        className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors">
        <PhoneOff className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── FULL GRID ─────────────────────────────────────────────────────────────────
function FullGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  return (
    <GridLayout tracks={tracks} className="h-full">
      <ParticipantTile />
    </GridLayout>
  )
}

// ── FULL CONTROLS BAR ─────────────────────────────────────────────────────────
function FullControls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const room = useRoomContext()
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [isSharing, setIsSharing] = useState(false)

  const toggleMic = async () => {
    try { await localParticipant.setMicrophoneEnabled(!isMicOn); setIsMicOn(v => !v) }
    catch (e) { console.error(e) }
  }
  const toggleCam = async () => {
    try { await localParticipant.setCameraEnabled(!isCamOn); setIsCamOn(v => !v) }
    catch (e) { console.error(e) }
  }
  const toggleShare = async () => {
    try { await localParticipant.setScreenShareEnabled(!isSharing); setIsSharing(v => !v) }
    catch (e) { console.error(e) }
  }
  const handleLeave = () => { room.disconnect(); onLeave() }

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 border-t border-gray-800 shrink-0">
      <button onClick={toggleMic} title={isMicOn ? 'Mute' : 'Unmute'}
        className={`p-3 rounded-full transition-colors ${isMicOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
        {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
      <button onClick={toggleCam} title={isCamOn ? 'Camera off' : 'Camera on'}
        className={`p-3 rounded-full transition-colors ${isCamOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
        {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
      </button>
      <button onClick={toggleShare} title={isSharing ? 'Stop sharing' : 'Share screen'}
        className={`p-3 rounded-full transition-colors ${isSharing ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}>
        {isSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
      </button>
      <button onClick={handleLeave} title="Leave call"
        className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors">
        <PhoneOff className="w-5 h-5" />
      </button>
    </div>
  )
}
