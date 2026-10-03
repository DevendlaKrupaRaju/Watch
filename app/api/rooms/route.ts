import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/db/prisma'
import { createRoomSchema } from '@/lib/validation/room-schemas'

function generateRoomCode(): string {
  return nanoid(6).toUpperCase()
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createRoomSchema.safeParse(body)

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors
      const firstError = Object.values(errors).flat()[0] || 'Validation failed'
      return NextResponse.json({ success: false, error: firstError }, { status: 400 })
    }

    const { name, description, isPrivate, password, maxParticipants, theme } = parsed.data

    // Generate unique room code
    let roomCode = generateRoomCode()
    let attempts = 0
    while (await prisma.room.findUnique({ where: { roomCode } })) {
      roomCode = generateRoomCode()
      attempts++
      if (attempts > 10) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate room code. Please try again.' },
          { status: 500 }
        )
      }
    }

    // Hash password if private
    let passwordHash: string | null = null
    if (isPrivate && password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    // Create room and add creator as host
    const room = await prisma.room.create({
      data: {
        roomCode,
        name,
        description: description || null,
        hostId: session.user.id,
        isPrivate,
        passwordHash,
        maxParticipants,
        theme: theme || null,
        members: {
          create: {
            userId: session.user.id,
            role: 'HOST',
          },
        },
      },
      include: {
        host: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        roomCode: room.roomCode,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        maxParticipants: room.maxParticipants,
        host: room.host,
        memberCount: room._count.members,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create room error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.roomMember.findMany({
      where: { userId: session.user.id },
      include: {
        room: {
          include: {
            host: { select: { id: true, username: true, avatarUrl: true } },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const rooms = memberships.map((m) => ({
      id: m.room.id,
      roomCode: m.room.roomCode,
      name: m.room.name,
      description: m.room.description,
      isPrivate: m.room.isPrivate,
      isLocked: m.room.isLocked,
      maxParticipants: m.room.maxParticipants,
      host: m.room.host,
      memberCount: m.room._count.members,
      role: m.role,
      joinedAt: m.joinedAt,
    }))

    return NextResponse.json({ success: true, data: rooms })
  } catch (error) {
    console.error('Get rooms error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
