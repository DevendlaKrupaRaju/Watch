import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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
    const body = await request.json().catch(() => ({}))

    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: { _count: { select: { members: true } } },
    })

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found. Please check the room code.' },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMember = await prisma.roomMember.findFirst({
      where: { roomId: room.id, userId: session.user.id },
    })

    if (existingMember) {
      return NextResponse.json({
        success: true,
        data: { roomCode: room.roomCode, alreadyMember: true },
      })
    }

    // Check if room is locked
    if (room.isLocked) {
      return NextResponse.json(
        { success: false, error: 'This room is currently locked.' },
        { status: 403 }
      )
    }

    // Check participant limit
    if (room._count.members >= room.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'This room is full.' },
        { status: 403 }
      )
    }

    // Check private room password
    if (room.isPrivate && room.passwordHash) {
      const password = body.password
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'This is a private room. Please enter the password.', requiresPassword: true },
          { status: 403 }
        )
      }

      const passwordMatch = await bcrypt.compare(password, room.passwordHash)
      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, error: 'Incorrect room password.' },
          { status: 403 }
        )
      }
    }

    // Add member
    await prisma.roomMember.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        role: 'MEMBER',
      },
    })

    return NextResponse.json({
      success: true,
      data: { roomCode: room.roomCode, name: room.name },
    })
  } catch (error) {
    console.error('Join room error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
