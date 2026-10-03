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
    const room = await prisma.room.findUnique({ where: { roomCode } })
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    const polls = await prisma.poll.findMany({
      where: { roomId: room.id, isActive: true },
      include: {
        votes: { select: { optionId: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: polls })
  } catch (error) {
    console.error('Get polls error:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}

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
    const body = await request.json()

    const room = await prisma.room.findUnique({ where: { roomCode } })
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    const member = await prisma.roomMember.findFirst({
      where: { roomId: room.id, userId: session.user.id },
    })
    if (!member) {
      return NextResponse.json({ success: false, error: 'Not a member' }, { status: 403 })
    }

    const poll = await prisma.poll.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        question: body.question,
        options: body.options,
      },
      include: {
        votes: { select: { optionId: true, userId: true } },
      },
    })

    return NextResponse.json({ success: true, data: poll }, { status: 201 })
  } catch (error) {
    console.error('Create poll error:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
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
    const body = await request.json()
    const { pollId, optionId } = body

    const room = await prisma.room.findUnique({ where: { roomCode } })
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    const existingVote = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId: session.user.id } },
    })
    if (existingVote) {
      return NextResponse.json({ success: false, error: 'Already voted' }, { status: 400 })
    }

    await prisma.pollVote.create({
      data: { pollId, userId: session.user.id, optionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
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
    const body = await request.json()
    const { pollId } = body

    const room = await prisma.room.findUnique({ where: { roomCode } })
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    const poll = await prisma.poll.findUnique({ where: { id: pollId } })
    if (!poll) {
      return NextResponse.json({ success: false, error: 'Poll not found' }, { status: 404 })
    }

    if (poll.userId !== session.user.id && room.hostId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

    await prisma.poll.update({ where: { id: pollId }, data: { isActive: false } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Close poll error:', error)
    return NextResponse.json({ success: false, error: 'Something went wrong' }, { status: 500 })
  }
}
