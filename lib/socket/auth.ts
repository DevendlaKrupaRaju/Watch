import type { Socket } from 'socket.io'

export interface AuthenticatedSocket extends Socket {
  userId?: string
  username?: string
}

export async function authenticateSocket(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) {
  try {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('Authentication required'))
    }

    // For now, we pass the userId directly from the client session
    // In production, you'd verify a JWT or session token
    const userId = socket.handshake.auth?.userId
    const username = socket.handshake.auth?.username

    if (!userId || !username) {
      return next(new Error('Invalid authentication data'))
    }

    socket.userId = userId
    socket.username = username
    next()
  } catch {
    next(new Error('Authentication failed'))
  }
}
