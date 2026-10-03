import { JoinRoomForm } from '@/components/room/JoinRoomForm'

export const metadata = {
  title: 'Join Room - WatchHub',
  description: 'Join an existing watch party',
}

export default function JoinRoomPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <JoinRoomForm />
    </div>
  )
}
