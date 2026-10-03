import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/db/prisma'
import { createLiveKitToken } from '@/lib/livekit/server'

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

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: { _count: { select: { members: true } } },
    })

    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    // Verify membership
    const member = await prisma.roomMember.findFirst({
      where: { roomId: room.id, userId: session.user.id },
    })

    if (!member) {
      return NextResponse.json({ success: false, error: 'Not a member of this room' }, { status: 403 })
    }

    // Check LiveKit configuration
    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Video calls are not configured. LiveKit credentials required.' },
        { status: 503 }
      )
    }

    const token = await createLiveKitToken(
      `watchhub-${roomCode}`,
      session.user.name || 'User',
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: {
        token,
        url: process.env.LIVEKIT_URL || '',
      },
    })
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate call token' },
      { status: 500 }
    )
  }
}
