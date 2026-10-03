import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/db/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { roomCode } = await params

    const room = await prisma.room.findUnique({
      where: { roomCode },
      include: {
        host: { select: { id: true, username: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true } },
      },
    })

    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    // Check if user is a member
    const isMember = room.members.some((m) => m.userId === session.user!.id)

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        roomCode: room.roomCode,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        isLocked: room.isLocked,
        maxParticipants: room.maxParticipants,
        theme: room.theme,
        host: room.host,
        members: room.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          username: m.user.username,
          avatarUrl: m.user.avatarUrl,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
        memberCount: room._count.members,
        isMember,
        createdAt: room.createdAt,
      },
    })
  } catch (error) {
    console.error('Get room error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    if (room.hostId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Only the host can update room settings' }, { status: 403 })
    }

    const body = await request.json()
    const allowedFields = ['name', 'description', 'isLocked', 'maxParticipants', 'theme']
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updatedRoom })
  } catch (error) {
    console.error('Update room error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    if (room.hostId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Only the host can delete the room' }, { status: 403 })
    }

    await prisma.room.delete({ where: { id: room.id } })

    return NextResponse.json({ success: true, data: { message: 'Room deleted' } })
  } catch (error) {
    console.error('Delete room error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
