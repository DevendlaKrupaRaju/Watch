'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LogOut, Tv } from 'lucide-react'
import { RoomLayout } from '@/components/room/RoomLayout'
import { RoomHeader } from '@/components/room/RoomHeader'
import { ParticipantList } from '@/components/room/ParticipantList'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { MediaPlayer } from '@/components/media/MediaPlayer'
import { VideoGrid } from '@/components/video/VideoGrid'
import { Reactions } from '@/components/room/Reactions'
import { HandRaise } from '@/components/room/HandRaise'
import { PollCreator } from '@/components/room/PollCreator'
import { PollDisplay } from '@/components/room/PollDisplay'
import { InviteDialog } from '@/components/room/InviteDialog'
import { RoomSettings } from '@/components/room/RoomSettings'
import { useRoom } from '@/hooks/use-room'
import { useSocket } from '@/hooks/use-socket'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface RoomData {
  id: string
  roomCode: string
  name: string
  description: string | null
  isPrivate: boolean
  isLocked: boolean
  maxParticipants: number
  theme: string | null
  host: { id: string; username: string; avatarUrl: string | null }
  members: {
    id: string
    userId: string
    username: string
    avatarUrl: string | null
    role: string
    joinedAt: string
  }[]
  memberCount: number
  isMember: boolean
  createdAt: string
}

export default function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [room, setRoom] = useState<RoomData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)

  const handleUpdateRoomSettings = async (data: { name: string; description: string; maxParticipants: number }) => {
    const res = await fetch(`/api/rooms/${roomCode}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) {
      setRoom((prev) => prev ? { ...prev, name: data.name, description: data.description, maxParticipants: data.maxParticipants } : null)
    } else {
      throw new Error(json.error || 'Failed to update')
    }
  }

  const handleEndRoom = async () => {
    if (confirm('Are you sure you want to end this room for everyone?')) {
      await fetch(`/api/rooms/${roomCode}`, { method: 'DELETE' })
      router.push('/dashboard')
    }
  }

  const {
    onlineUsers,
    error: socketError,
    leaveRoom,
    lockRoom,
    unlockRoom,
    removeUser,
    transferHost,
  } = useRoom(roomCode)
  const { socket } = useSocket()

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(`/api/rooms/${roomCode}`)
        const data = await res.json()

        if (!data.success) {
          setError(data.error || 'Room not found')
          return
        }

        if (!data.data.isMember) {
          // Try to join
          const joinRes = await fetch(`/api/rooms/${roomCode}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          const joinData = await joinRes.json()

          if (!joinData.success) {
            if (joinData.requiresPassword) {
              router.push(`/join?code=${roomCode}&private=true`)
              return
            }
            setError(joinData.error || 'Cannot join room')
            return
          }

          // Re-fetch room data after joining
          const refetchRes = await fetch(`/api/rooms/${roomCode}`)
          const refetchData = await refetchRes.json()
          setRoom(refetchData.data)
        } else {
          setRoom(data.data)
        }
      } catch {
        setError('Failed to load room')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRoom()
  }, [roomCode, router])

  // Handle socket errors (e.g., kicked from room)
  useEffect(() => {
    if (socketError === 'You have been removed from the room') {
      router.push('/dashboard?removed=true')
    }
  }, [socketError, router])

  const handleLeave = async () => {
    try {
      leaveRoom()
      await fetch(`/api/rooms/${roomCode}/leave`, { method: 'POST' })
      router.push('/dashboard')
    } catch {
      router.push('/dashboard')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tv className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {error || 'Room not found'}
          </h2>
          <p className="text-gray-400 mb-6">
            The room you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const currentUserId = session?.user?.id || ''
  const isHost = room.host.id === currentUserId
  const onlineUserIds = onlineUsers.map((u) => u.userId)

  return (
    <>
    <RoomLayout
      header={
        <RoomHeader
          roomName={room.name}
          roomCode={room.roomCode}
          isLocked={room.isLocked}
          isHost={isHost}
          memberCount={room.memberCount}
          onLock={lockRoom}
          onUnlock={unlockRoom}
          onSettings={() => setShowSettingsDialog(true)}
          onInvite={() => setShowInviteDialog(true)}
        />
      }
      mainContent={
        <div id="room-main-content" className="relative h-full w-full bg-black">
          {/* Media player fills entire area */}
          <MediaPlayer
            socket={socket}
            roomCode={roomCode}
            currentUserId={currentUserId}
            isHost={isHost}
          />

          {/* Floating video panel — absolute so it stays inside fullscreen container */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="relative h-full w-full">
              <div className="pointer-events-auto">
                <VideoGrid
                  roomCode={roomCode}
                  onLeaveCall={() => {}}
                  overlay={true}
                />
              </div>
            </div>
          </div>

          {/* Poll display overlay */}
          <div className="absolute bottom-4 left-4 right-48 pointer-events-auto z-10">
            <PollDisplay
              roomCode={roomCode}
              socket={socket}
              currentUserId={currentUserId}
              isHost={isHost}
            />
          </div>
        </div>
      }
      sidebar={
        <ParticipantList
          participants={room.members.map((m) => ({
            userId: m.userId,
            username: m.username,
            avatarUrl: m.avatarUrl,
            role: m.role,
          }))}
          onlineUserIds={onlineUserIds}
          currentUserId={currentUserId}
          isHost={isHost}
          onRemoveUser={removeUser}
          onTransferHost={transferHost}
        />
      }
      chat={
        <ChatPanel
          roomCode={roomCode}
          socket={socket}
          currentUserId={currentUserId}
          isHost={isHost}
        />
      }
      controls={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <HandRaise
              socket={socket}
              roomCode={roomCode}
              userId={currentUserId}
              username={session?.user?.name || 'User'}
            />
            <Reactions
              socket={socket}
              roomCode={roomCode}
              username={session?.user?.name || 'User'}
            />
            {isHost && (
              <button
                onClick={() => setShowPollCreator(true)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs transition-colors"
              >
                📊 Poll
              </button>
            )}
          </div>
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Leave Room
          </button>
        </div>
      }
    />

    {/* Poll Creator Modal */}
    {showPollCreator && (
      <PollCreator
        roomCode={roomCode}
        onClose={() => setShowPollCreator(false)}
      />
    )}

    {/* Invite Dialog Modal (Phase 2) */}
    <InviteDialog
      roomCode={roomCode}
      roomName={room.name}
      isOpen={showInviteDialog}
      onClose={() => setShowInviteDialog(false)}
    />

    {/* Room Settings Modal (Phase 2) */}
    {isHost && (
      <RoomSettings
        roomCode={roomCode}
        initialName={room.name}
        initialDescription={room.description}
        initialMaxParticipants={room.maxParticipants}
        isLocked={room.isLocked}
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
        onUpdate={handleUpdateRoomSettings}
        onToggleLock={room.isLocked ? unlockRoom : lockRoom}
        onEndRoom={handleEndRoom}
      />
    )}
    </>
  )
}
