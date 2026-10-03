import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { authenticateSocket, type AuthenticatedSocket } from './auth'
import { registerRoomHandlers } from './room-handlers'
import { registerChatHandlers } from './chat-handlers'
import { registerMediaHandlers } from './media-handlers'

let io: SocketIOServer | null = null

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Authentication middleware
  io.use((socket, next) => {
    authenticateSocket(socket as AuthenticatedSocket, next)
  })

  // Connection handler
  io.on('connection', (socket) => {
    const authSocket = socket as AuthenticatedSocket
    console.log(`User connected: ${authSocket.username} (${authSocket.userId})`)

    // Register event handlers
    registerRoomHandlers(io!, authSocket)
    registerChatHandlers(io!, authSocket)
    registerMediaHandlers(io!, authSocket)

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${authSocket.username} - ${reason}`)
    })
  })

  console.log('Socket.IO server initialized')
  return io
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO not initialized')
  return io
}
