import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/db/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { roomCode } = await params

    const room = await prisma.room.findUnique({ where: { roomCode } })
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    // Host cannot leave, they must transfer host first or delete room
    if (room.hostId === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'The host cannot leave. Transfer host privileges first or delete the room.' },
        { status: 400 }
      )
    }

    await prisma.roomMember.deleteMany({
      where: { roomId: room.id, userId: session.user.id },
    })

    return NextResponse.json({ success: true, data: { message: 'Left room successfully' } })
  } catch (error) {
    console.error('Leave room error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
