import { CreateRoomForm } from '@/components/room/CreateRoomForm'

export const metadata = {
  title: 'Create Room - WatchHub',
  description: 'Create a new watch party room',
}

export default function CreateRoomPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <CreateRoomForm />
    </div>
  )
}
